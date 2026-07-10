import type z from "zod";
import type { loginSchema } from "./auth.validation.js";

export type LoginDto = z.infer<typeof loginSchema.body>;

export interface SignupDto {
  username: string;
  email: string;
  password: string;
  role?: number;
}
