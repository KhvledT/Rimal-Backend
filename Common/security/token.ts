import {
  JWT_SECRET_REFRESH_ADMIN,
  JWT_SECRET_ACCESS_USER,
  JWT_SECRET_ACCESS_ADMIN,
  JWT_SECRET_REFRESH_USER,
} from "../../config/config.service.js";
import { TokenTypeEnum } from "../../enums/token.enum.js";
import { RoleEnum } from "../../enums/user.enums.js";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import type { IHUser } from "../../DB/Models/user.model.js";
import userRepo from "../../Repo/user.repo.js";
import { BadRequest } from "../Exeptions/domain.error.js";

/**
 * Shape of the access token payload stored inside the JWT body.
 * The `type` field is EXPLICIT — the refresh endpoint rejects any token
 * whose payload.type !== "refresh", regardless of the `aud` array.
 */
export interface AccessTokenPayload {
  sub: string;
  type: TokenTypeEnum.access;
  role: number;
  jti: string;
}

/**
 * Shape of the refresh token payload stored inside the JWT body.
 * The `type` field is EXPLICIT — prevents access tokens being used as refresh tokens
 * even if an attacker constructs a token with the correct audience.
 */
export interface RefreshTokenPayload {
  sub: string;
  type: TokenTypeEnum.refresh;
  role: number;
  jti: string;
}

class TokenService {
  /**
   * Returns the correct access/refresh secret pair for a given role.
   * Access and refresh secrets are ALWAYS independent — they are never shared.
   *
   * User  → JWT_SECRET_ACCESS_USER  / JWT_SECRET_REFRESH_USER
   * Admin → JWT_SECRET_ACCESS_ADMIN / JWT_SECRET_REFRESH_ADMIN
   */
  getSignature(role: RoleEnum = RoleEnum.User) {
    let accessSignature = "";
    let refreshSignature = "";

    switch (role) {
      case RoleEnum.User:
        accessSignature = JWT_SECRET_ACCESS_USER;
        refreshSignature = JWT_SECRET_REFRESH_USER;
        break;

      case RoleEnum.Admin:
      case RoleEnum.SuperAdmin:
        accessSignature = JWT_SECRET_ACCESS_ADMIN;
        refreshSignature = JWT_SECRET_REFRESH_ADMIN;
        break;
    }
    return { accessSignature, refreshSignature };
  }

  private generateToken({
    payload = {},
    signature,
    options = {},
  }: {
    payload?: object;
    signature: string;
    options?: jwt.SignOptions;
  }) {
    return jwt.sign(payload, signature, options);
  }

  verifyToken({ token, signature }: { token: string; signature: string }) {
    return jwt.verify(token, signature);
  }

  decodeToken(token: string) {
    return jwt.decode(token);
  }

  async checkToken(token: string) {
    const verifiedToken = this.verifyToken({ token, signature: JWT_SECRET_ACCESS_USER }) as jwt.JwtPayload;
    if (!verifiedToken) throw new BadRequest("Invalid token");
    const user = await userRepo.findById({ id: verifiedToken.sub as string });
    return { user, verifiedToken };
  }

  /**
   * Used during Login.
   * Both tokens share the same jti — the session lookup key is the jti.
   * The explicit `type` field in each payload prevents cross-use.
   */
  generateAccessAndRefreshToken(user: IHUser) {
    const { accessSignature, refreshSignature } = this.getSignature(Number(user.role));

    const tokenId = randomUUID();

    const access_Token = this.generateToken({
      payload: {
        type: TokenTypeEnum.access,
        role: user.role,
      },
      signature: accessSignature,
      options: {
        audience: [String(user.role), TokenTypeEnum.access],
        expiresIn: 60 * 15, // 15 minutes
        subject: user._id.toString(),
        jwtid: tokenId,
      },
    });

    const refresh_Token = this.generateToken({
      payload: {
        type: TokenTypeEnum.refresh,
        role: user.role,
      },
      signature: refreshSignature,
      options: {
        audience: [String(user.role), TokenTypeEnum.refresh],
        expiresIn: "1y", // 1 year
        subject: user._id.toString(),
        jwtid: tokenId,
      },
    });

    return { access_Token, refresh_Token, jti: tokenId };
  }

  /**
   * Used during Refresh Token rotation.
   * Access token and refresh token receive INDEPENDENT jti values so the
   * session can be updated atomically without unique-index conflicts on accessTokenJti.
   * The explicit `type` payload field is set on both tokens.
   */
  generateRotatedTokenPair(user: IHUser) {
    const { accessSignature, refreshSignature } = this.getSignature(Number(user.role));

    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    const access_Token = this.generateToken({
      payload: {
        type: TokenTypeEnum.access,
        role: user.role,
      },
      signature: accessSignature,
      options: {
        audience: [String(user.role), TokenTypeEnum.access],
        expiresIn: 60 * 15, // 15 minutes
        subject: user._id.toString(),
        jwtid: accessJti,
      },
    });

    const refresh_Token = this.generateToken({
      payload: {
        type: TokenTypeEnum.refresh,
        role: user.role,
      },
      signature: refreshSignature,
      options: {
        audience: [String(user.role), TokenTypeEnum.refresh],
        expiresIn: "1y", // 1 year
        subject: user._id.toString(),
        jwtid: refreshJti,
      },
    });

    return { access_Token, refresh_Token, accessJti, refreshJti };
  }
}

export default new TokenService();
