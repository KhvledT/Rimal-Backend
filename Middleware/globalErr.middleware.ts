import type { Request, Response, NextFunction } from "express";
import type CustomErorr from "../Common/Exeptions/custom.error.js";
import { NODE_ENV } from "../config/config.service.js";
import { loggerService } from "../Common/Logger/logger.service.js";

function globalErrorHandler(
  err: CustomErorr,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Ensure server logs capture full diagnostics
  loggerService.error("Global Error Handler caught:", err);

  const statusCode = err.StatusCode || 500;

  if (NODE_ENV === "production") {
    res.status(statusCode).json({
      message: statusCode === 500 ? "Internal Server Error" : err.message,
      stack: err.stack,
      cause: err.cause,
      statusCode,
    });
  } else {
    res.status(statusCode).json({
      message: err.message,
      stack: err.stack,
      cause: err.cause,
      error: err,
    });
  }
}

export default globalErrorHandler;
