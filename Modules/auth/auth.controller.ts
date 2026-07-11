import express from "express";
import authService from "./auth.service.js";
import success from "../../Common/Response/success.response.js";
import {
  loginSchema,
  signupSchema,
  verifySignupSchema,
  resendSignupOtpSchema,
  refreshTokenSchema,
} from "./auth.validation.js";
import { validation } from "../../Middleware/validation.middleware.js";
import { authentication } from "../../Middleware/authentication.middleware.js";
import { RoleEnum } from "../../enums/user.enums.js";
import { RateLimitFactory } from "../../Common/RateLimit/rateLimit.factory.js";

const authRouter: express.Router = express.Router();

authRouter.post(
  "/login",
  RateLimitFactory.createLimiter("authLogin"),
  validation(loginSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await authService.login(req.body, {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });
      success({
        res,
        StatusCode: 200,
        result,
        message: "Login successful",
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/signup",
  RateLimitFactory.createLimiter("authSignup"),
  validation(signupSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await authService.signup(req.body);
      success({
        res,
        StatusCode: 200,
        result,
        message: "Verification code sent successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/verify-signup",
  RateLimitFactory.createLimiter("verifySignupOtp"),
  validation(verifySignupSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await authService.verifySignup(req.body);
      success({
        res,
        StatusCode: 201,
        result,
        message: "Registration successful",
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/resend-signup-otp",
  RateLimitFactory.createLimiter("resendSignupOtp"),
  validation(resendSignupOtpSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await authService.resendSignupOtp(req.body);
      success({
        res,
        StatusCode: 200,
        result,
        message: "Verification code resent successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/logout",
  authentication([RoleEnum.User, RoleEnum.Admin, RoleEnum.SuperAdmin]),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await authService.logout(req.tokenPayload.jti, req.user._id.toString());
      success({
        res,
        StatusCode: 200,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

authRouter.post(
  "/refresh-token",
  RateLimitFactory.createLimiter("authRefreshToken"),
  validation(refreshTokenSchema),
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      const result = await authService.refreshToken(req.body, {
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      });
      success({
        res,
        StatusCode: 200,
        result,
        message: "Token refreshed successfully",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default authRouter;
