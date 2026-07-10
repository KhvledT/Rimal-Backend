import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { rateLimitConfigs } from "./rateLimit.config.js";

export class RateLimitFactory {
  public static createLimiter(configKey: string) {
    const config = rateLimitConfigs[configKey];
    if (!config) {
      throw new Error(`Rate limit configuration not found for key: ${configKey}`);
    }

    return rateLimit({
      ...config,
      handler: (req: Request, res: Response) => {
        // Enforce the standard application JSON response format on HTTP 429 block
        res.status(429).json({
          message: config.message,
        });
      },
    });
  }
}
