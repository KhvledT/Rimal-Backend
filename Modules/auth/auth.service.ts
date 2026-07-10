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
import { OtpPurposeEnum } from "../../DB/Models/otp.model.js";
import type { LoginDto, SignupDto, VerifySignupDto, ResendSignupOtpDto } from "./auth.dto.js";

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

  async login(body: LoginDto, reqMetadata?: { ip?: string; userAgent?: string }) {
    const { username, password } = body;

    // Find user by userName or email
    const user = await this._userRepo.findOne({
      filter: {
        $or: [{ userName: username }, { email: username }],
      },
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

    // Hash the refresh token before storing
    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refresh_Token)
      .digest("hex");

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
    await mailService.sendMail({
      to: email,
      subject: "Rimal Registration Code",
      html: getSignupOtpTemplate(otp),
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

    await mailService.sendMail({
      to: email,
      subject: "Rimal Registration Code",
      html: getSignupOtpTemplate(otp),
    });

    return {
      message: "Verification code sent successfully",
      email,
    };
  }
}

export default new AuthService();
