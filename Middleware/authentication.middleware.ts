import type { Request, Response, NextFunction } from "express";
import { Unauthorized } from "../Common/Exeptions/domain.error.js";
import tokenService from "../Common/security/token.js";
import userRepo from "../Repo/user.repo.js";
import { RoleEnum } from "../enums/user.enums.js";

declare global {
  namespace Express {
    interface Request {
      user?: any;
      tokenPayload?: any;
    }
  }
}

export function authentication() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Unauthorized("Access token is required");
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        throw new Unauthorized("Access token is required");
      }

      const decoded = tokenService.decodeToken(token) as any;
      if (!decoded || !decoded.sub) {
        throw new Unauthorized("Invalid token format");
      }

      const user = await userRepo.findById({ id: decoded.sub });
      if (!user) {
        throw new Unauthorized("User not found");
      }

      // Extract signature based on user's role
      const { accessSignature } = tokenService.getSignature(user.role);

      try {
        const verified = tokenService.verifyToken({ token, signature: accessSignature });
        req.user = user;
        req.tokenPayload = verified;
      } catch (err) {
        throw new Unauthorized("Invalid or expired token");
      }

      if (user.role !== RoleEnum.Admin) {
        throw new Unauthorized("Admin privilege required");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
