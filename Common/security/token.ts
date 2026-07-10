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

class TokenService {
  getSignature(role : RoleEnum = RoleEnum.User) {
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

  generateAccessAndRefreshToken(user: IHUser) {
    const { accessSignature, refreshSignature } = this.getSignature(Number(user.role));

    const tokenId = randomUUID();

    const access_Token = this.generateToken({
      signature: accessSignature,
      options: {
        audience: [String(user.role), TokenTypeEnum.access],
        expiresIn: 60 * 15, // 15 minutes
        subject: user._id.toString(),
        jwtid: tokenId,
      },
    });

    const refresh_Token = this.generateToken({
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
}

export default new TokenService();
