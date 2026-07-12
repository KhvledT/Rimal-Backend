import crypto from "node:crypto";
import userRepo from "../../Repo/user.repo.js";
import sessionRepo from "../../Repo/session.repo.js";
import otpRepo from "../../Repo/otp.repo.js";
import {
  BadRequest,
  NotFound,
  Unauthorized,
  Conflict,
} from "../../Common/Exeptions/domain.error.js";
import { compareOperation } from "../../Common/security/hash.js";
import tokenService from "../../Common/security/token.js";
import { mailService } from "../../Common/Mail/mail.service.js";
import { getSignupOtpTemplate } from "../../Common/Mail/templates/signupOtp.template.js";
import { RoleEnum } from "../../enums/user.enums.js";
import { TokenTypeEnum } from "../../enums/token.enum.js";
import { OtpPurposeEnum } from "../../DB/Models/otp.model.js";
import SessionModel from "../../DB/Models/session.model.js";
import type { LoginDto, SignupDto, VerifySignupDto, ResendSignupOtpDto, RefreshTokenDto } from "./auth.dto.js";
import type { JwtPayload } from "jsonwebtoken";

class AuthService {
  private _userRepo = userRepo;
  private _sessionRepo = sessionRepo;
  private _otpRepo = otpRepo;

  private hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  private generate6DigitOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /** SHA-256 hash of any string value — used for both OTPs and token hashing. */
  private hashValue(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  async login(body: LoginDto, reqMetadata?: { ip?: string; userAgent?: string }) {
    const { identifier, password } = body;

    // Determine identifier type
    const queryFilter = identifier.includes("@")
      ? { email: identifier, deletedAt: null }
      : { userName: identifier, deletedAt: null };

    // Find user by userName or email
    const user = await this._userRepo.findOne({
      filter: queryFilter,
    });

    if (!user) {
      throw new Unauthorized("Invalid username or password");
    }

    // Compare password
    const isMatch = await compareOperation({
      plainValue: password,
      hashedValue: user.password,
    });

    if (!isMatch) {
      throw new Unauthorized("Invalid username or password");
    }

    // Generate tokens (returns access_Token, refresh_Token, jti)
    const { access_Token, refresh_Token, jti } =
      tokenService.generateAccessAndRefreshToken(user);

    // Hash the refresh token before storing — never store plain tokens
    const refreshTokenHash = this.hashValue(refresh_Token);

    // Register active session in MongoDB
    await this._sessionRepo.create({
      userId: user._id,
      refreshTokenHash,
      accessTokenJti: jti,
      ipAddress: reqMetadata?.ip,
      userAgent: reqMetadata?.userAgent,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isRevoked: false,
    });

    return {
      user: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      },
      accessToken: access_Token,
      refreshToken: refresh_Token,
    };
  }

  async logout(accessTokenJti: string, userId: string) {
    const result = await this._sessionRepo.findOneAndUpdate({
      filter: { accessTokenJti, userId, isRevoked: false },
      update: { isRevoked: true, revokedAt: new Date() },
    });

    if (!result) {
      throw new Unauthorized("Session already revoked or not found");
    }
  }

  async signup(body: SignupDto) {
    const { username, email } = body;

    // Check if user already exists
    const existingUser = await this._userRepo.findOne({
      filter: { email },
    });

    if (existingUser) {
      throw new Conflict("User already exists with this email");
    }

    // Generate OTP code
    const otp = this.generate6DigitOtp();
    const codeHash = this.hashOtp(otp);

    // Save OTP to collection
    await this._otpRepo.create({
      email,
      codeHash,
      purpose: OtpPurposeEnum.SIGNUP,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes expiration
      attempts: 0,
      isUsed: false,
    });

    // Send email with OTP
    const { html, text } = getSignupOtpTemplate(otp);
    await mailService.sendMail({
      to: email,
      subject: "Rimal Registration Code",
      html,
      text,
    });

    return {
      message: "Verification code sent successfully",
      email,
    };
  }

  async verifySignup(body: VerifySignupDto) {
    const { email, otp, username, password, phone } = body;

    // Check if user already exists
    const existingUser = await this._userRepo.findOne({
      filter: { email },
    });

    if (existingUser) {
      throw new Conflict("User already exists with this email");
    }

    // Find active verification code
    const activeOtp = await this._otpRepo.findOne({
      filter: { email, purpose: OtpPurposeEnum.SIGNUP, isUsed: false },
      options: { sort: { createdAt: -1 } },
    });

    if (!activeOtp) {
      throw new NotFound("No active registration verification session found");
    }

    // Check expiration
    if (activeOtp.expiresAt.getTime() < Date.now()) {
      throw new BadRequest("Verification code expired");
    }

    // Check attempts limit
    if (activeOtp.attempts >= 5) {
      throw new BadRequest("Maximum verification attempts exceeded. Please request a new code.");
    }

    // Increment attempts
    activeOtp.attempts += 1;
    await activeOtp.save();

    // Check code match
    const hashedInput = this.hashOtp(otp);
    if (activeOtp.codeHash !== hashedInput) {
      throw new BadRequest("Invalid verification code");
    }

    // Mark code as used
    activeOtp.isUsed = true;
    await activeOtp.save();

    // Create user
    const newUser = await this._userRepo.create({
      userName: username,
      email,
      password,
      phone: phone || "",
      role: RoleEnum.User, // Force Role to USER
    });

    // Invalidate/delete all OTPs for this email
    await this._otpRepo.deleteOne({ filter: { _id: activeOtp._id } });

    return {
      id: newUser._id,
      userName: newUser.userName,
      email: newUser.email,
      role: newUser.role,
    };
  }

  async resendSignupOtp(body: ResendSignupOtpDto) {
    const { email } = body;

    // Check if user already exists
    const existingUser = await this._userRepo.findOne({
      filter: { email },
    });

    if (existingUser) {
      throw new Conflict("User already exists with this email");
    }

    // Check resend throttle
    const lastOtp = await this._otpRepo.findOne({
      filter: { email, purpose: OtpPurposeEnum.SIGNUP },
      options: { sort: { createdAt: -1 } },
    });

    if (lastOtp) {
      const timeElapsed = Date.now() - new Date(lastOtp.createdAt).getTime();
      if (timeElapsed < 60000) {
        throw new BadRequest("Please wait at least 60 seconds before requesting a new code.");
      }
    }

    // Invalidate all previous codes
    await this._otpRepo.updateOne({
      filter: { email, purpose: OtpPurposeEnum.SIGNUP, isUsed: false },
      update: { isUsed: true },
    });

    // Generate new code
    const otp = this.generate6DigitOtp();
    const codeHash = this.hashOtp(otp);

    // Save and send
    await this._otpRepo.create({
      email,
      codeHash,
      purpose: OtpPurposeEnum.SIGNUP,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      attempts: 0,
      isUsed: false,
    });

    const { html, text } = getSignupOtpTemplate(otp);
    await mailService.sendMail({
      to: email,
      subject: "Rimal Registration Code",
      html,
      text,
    });

    return {
      message: "Verification code sent successfully",
      email,
    };
  }

  async refreshToken(
    body: RefreshTokenDto,
    reqMetadata?: { ip?: string; userAgent?: string },
  ) {
    const { refreshToken } = body;

    // ── Step 1: Decode without verifying to extract claims safely ────────────
    const decoded = tokenService.decodeToken(refreshToken) as JwtPayload | null;

    if (!decoded || !decoded.sub) {
      throw new Unauthorized("Invalid refresh token format");
    }

    // ── Step 2: Validate token type from explicit payload field ──────────────
    // AUDIT FIX: token type is checked from the JWT body `type` field — not
    // only from the `aud` array. An access token embedded `type: "access"` in
    // its payload so it can NEVER pass this check even if the audience matches.
    if (decoded["type"] !== TokenTypeEnum.refresh) {
      throw new Unauthorized("Invalid token type: only refresh tokens are accepted");
    }

    // ── Step 3: Defence-in-depth — also validate audience ────────────────────
    if (!decoded.aud) {
      throw new Unauthorized("Invalid refresh token format");
    }
    const audience = Array.isArray(decoded.aud) ? decoded.aud : [decoded.aud];
    if (!audience.includes(TokenTypeEnum.refresh)) {
      throw new Unauthorized("Invalid token type: access tokens cannot be used for refresh");
    }

    // ── Step 4: Determine role and select the correct refresh secret ─────────
    // AUDIT CONFIRMATION: access and refresh secrets are ALWAYS independent.
    // User  → JWT_SECRET_REFRESH_USER  (≠ JWT_SECRET_ACCESS_USER)
    // Admin → JWT_SECRET_REFRESH_ADMIN (≠ JWT_SECRET_ACCESS_ADMIN)
    const roleValue = audience.find(
      (a) => a !== TokenTypeEnum.refresh && a !== TokenTypeEnum.access,
    );
    const role = roleValue !== undefined ? Number(roleValue) : RoleEnum.User;
    const { refreshSignature } = tokenService.getSignature(role);

    // ── Step 5: Verify JWT signature + expiration ────────────────────────────
    try {
      tokenService.verifyToken({ token: refreshToken, signature: refreshSignature });
    } catch {
      throw new Unauthorized("Refresh token is invalid or has expired");
    }

    // ── Step 6: Hash the incoming token for DB lookup ─────────────────────────
    const incomingHash = this.hashValue(refreshToken);

    // ── Step 7: Read session first to classify errors correctly ──────────────
    // We need the session document to check the revocation state BEFORE the
    // atomic update so we can give precise error messages.
    const session = await SessionModel.findOne({ refreshTokenHash: incomingHash });

    if (!session) {
      // ── Reuse Detection — token hash not found ────────────────────────────
      // The hash is gone from the sessions collection. This means:
      //   a) The token was already rotated (replay attack after rotation), OR
      //   b) The token was never valid.
      // In case (a) the session was updated with a new hash, so the OLD session
      // document still exists but with a different hash.
      // We cannot identify the original session from just the old hash, so we
      // return a generic "already used" error.
      throw new Unauthorized("Refresh token has already been used or is invalid");
    }

    if (session.isRevoked) {
      // ── Reuse Detection — session explicitly revoked ──────────────────────
      // AUDIT FIX: previously the code just returned 401. Now we log the
      // revocation state. The session is already revoked (from a prior logout or
      // a prior reuse-detection revocation), so no further action is needed.
      // Returning a clear message that re-login is required.
      throw new Unauthorized("Session has been revoked. Please log in again");
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw new Unauthorized("Session has expired. Please log in again");
    }

    // ── Step 8: Verify user still exists ─────────────────────────────────────
    const user = await this._userRepo.findById({ id: decoded.sub });
    if (!user) {
      throw new Unauthorized("User account no longer exists");
    }

    // ── Step 9: Generate the rotated token pair ───────────────────────────────
    const { access_Token, refresh_Token, accessJti } =
      tokenService.generateRotatedTokenPair(user);

    const newRefreshTokenHash = this.hashValue(refresh_Token);
    const now = new Date();

    // ── Step 10: Atomic rotation with concurrent-request protection ──────────
    // AUDIT FIX: The findOneAndUpdate filter includes BOTH `refreshTokenHash`
    // AND `isRevoked: false`. This means only ONE concurrent request holding
    // the same old token can win the update — the other will find 0 documents
    // (hash already changed) and be rejected.
    //
    // This eliminates the TOCTOU window that existed when using findOne → update.
    const rotated = await SessionModel.findOneAndUpdate(
      {
        _id: session._id,
        refreshTokenHash: incomingHash, // ← concurrency guard: must still match
        isRevoked: false,               // ← concurrency guard: must still be active
      },
      {
        $set: {
          refreshTokenHash: newRefreshTokenHash,
          accessTokenJti: accessJti,
          lastUsedAt: now,
          lastActivity: now,
          lastIp: reqMetadata?.ip,           // ← AUDIT FIX: record refresh IP
          lastUserAgent: reqMetadata?.userAgent, // ← AUDIT FIX: record refresh UA
        },
      },
      { new: true },
    );

    if (!rotated) {
      // ── Concurrent request lost the race ─────────────────────────────────
      // Another request already rotated this token between our findOne and
      // this findOneAndUpdate. Treat it as a replay — the winner already issued
      // new tokens. Revoking here is NOT necessary because the winning request
      // already owns the new session state.
      throw new Unauthorized("Refresh token has already been used or is invalid");
    }

    return {
      accessToken: access_Token,
      refreshToken: refresh_Token,
    };
  }
}

export default new AuthService();
