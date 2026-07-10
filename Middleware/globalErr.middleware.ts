import type { Request, Response, NextFunction } from "express";
import type CustomErorr from "../Common/Exeptions/custom.error.js";

function globalErrorHandler(
  err: CustomErorr,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res
    .status(err.StatusCode || 500)
    .json({
      message: err.message,
      stack: err.stack,
      cause: err.cause,
      error: err,
    });
}

export default globalErrorHandler;
