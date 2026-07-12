import z from "zod";

export const signupSchema = {
  body: z.strictObject({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(20, "Username must be at most 20 characters long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .max(100, "Password must be at most 100 characters long")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,
        "Password must contain at least one letter and one number",
      ),
  }),
};

export const verifySignupSchema = {
  body: z.strictObject({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "Verification code must be exactly 6 digits"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(20, "Username must be at most 20 characters long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .max(100, "Password must be at most 100 characters long")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,
        "Password must contain at least one letter and one number",
      ),
    phone: z.string().optional(),
  }),
};

export const resendSignupOtpSchema = {
  body: z.strictObject({
    email: z.string().email("Invalid email address"),
  }),
};

export const loginSchema = {
  body: z.strictObject({
    identifier: z
      .string()
      .trim()
      .min(1, "Identifier is required"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .max(100, "Password must be at most 100 characters long")
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{6,}$/,
        "Password must contain at least one letter and one number",
      ),
  }),
};

export const refreshTokenSchema = {
  body: z.strictObject({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
};
