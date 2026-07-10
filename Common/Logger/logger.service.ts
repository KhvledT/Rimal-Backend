import winston from "winston";
import { NODE_ENV } from "../../config/config.service.js";

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Custom formatted line output for development console readability
const devFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }), // Extract error stacks automatically
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  ),
  transports: [
    new winston.transports.Console({
      format:
        NODE_ENV === "production"
          ? combine(json()) // Structured JSON for production indexers/cloud logs
          : combine(colorize(), devFormat), // Human-friendly readable output for local development
    }),
  ],
});

// Helper function to dynamically scrub passwords, tokens, keys and credentials
function sanitize(obj: any): any {
  if (!obj) return obj;
  if (typeof obj !== "object") return obj;

  const sensitiveKeys = [
    "password",
    "jwt",
    "accessToken",
    "refreshToken",
    "otp",
    "code",
    "secret",
    "apiKey",
    "apiSecret",
    "credentials",
    "token",
  ];

  const clone = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      clone[key] = "[REDACTED]";
    } else if (typeof clone[key] === "object") {
      clone[key] = sanitize(clone[key]);
    }
  }

  return clone;
}

export const loggerService = {
  info(message: string, meta?: any) {
    logger.info(message, sanitize(meta));
  },
  warn(message: string, meta?: any) {
    logger.warn(message, sanitize(meta));
  },
  error(message: string, error?: any, meta?: any) {
    if (error instanceof Error) {
      logger.error(message, {
        stack: error.stack,
        message: error.message,
        ...sanitize(meta),
      });
    } else {
      logger.error(message, sanitize(error || meta));
    }
  },
  debug(message: string, meta?: any) {
    logger.debug(message, sanitize(meta));
  },
};
export default loggerService;
