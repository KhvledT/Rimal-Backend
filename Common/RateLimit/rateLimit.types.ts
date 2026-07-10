import type { Options } from "express-rate-limit";

export interface RateLimitConfigOptions extends Partial<Options> {
  windowMs: number;
  max: number;
  message: string;
}
