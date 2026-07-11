import {
  RATE_LIMIT_LOGIN_MAX,
  RATE_LIMIT_LOGIN_WINDOW,
  RATE_LIMIT_SIGNUP_MAX,
  RATE_LIMIT_SIGNUP_WINDOW,
  RATE_LIMIT_VERIFY_MAX,
  RATE_LIMIT_VERIFY_WINDOW,
  RATE_LIMIT_RESEND_MAX,
  RATE_LIMIT_RESEND_WINDOW,
  RATE_LIMIT_CONTACT_MAX,
  RATE_LIMIT_CONTACT_WINDOW,
  RATE_LIMIT_REFRESH_MAX,
  RATE_LIMIT_REFRESH_WINDOW,
} from "../../config/config.service.js";
import type { RateLimitConfigOptions } from "./rateLimit.types.js";

const commonHeaders = {
  standardHeaders: true, // Enable Draft-6 RateLimit-* headers
  legacyHeaders: false,  // Disable legacy X-RateLimit-* headers
};

export const rateLimitConfigs: Record<string, RateLimitConfigOptions> = {
  authLogin: {
    windowMs: RATE_LIMIT_LOGIN_WINDOW,
    max: RATE_LIMIT_LOGIN_MAX,
    message: "Too many login attempts. Please try again later.",
    ...commonHeaders,
  },
  authSignup: {
    windowMs: RATE_LIMIT_SIGNUP_WINDOW,
    max: RATE_LIMIT_SIGNUP_MAX,
    message: "Too many registration attempts. Please try again later.",
    ...commonHeaders,
  },
  verifySignupOtp: {
    windowMs: RATE_LIMIT_VERIFY_WINDOW,
    max: RATE_LIMIT_VERIFY_MAX,
    message: "Too many verification attempts. Please try again later.",
    ...commonHeaders,
  },
  resendSignupOtp: {
    windowMs: RATE_LIMIT_RESEND_WINDOW,
    max: RATE_LIMIT_RESEND_MAX,
    message: "Too many verification code requests. Please try again later.",
    ...commonHeaders,
  },
  contact: {
    windowMs: RATE_LIMIT_CONTACT_WINDOW,
    max: RATE_LIMIT_CONTACT_MAX,
    message: "Too many contact messages submitted. Please try again later.",
    ...commonHeaders,
  },
  authRefreshToken: {
    windowMs: RATE_LIMIT_REFRESH_WINDOW,
    max: RATE_LIMIT_REFRESH_MAX,
    message: "Too many token refresh attempts. Please try again later.",
    ...commonHeaders,
  },
};
