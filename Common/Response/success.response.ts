import type { Response } from "express";
interface ISuccessResponse<T> {
  res: Response;
  StatusCode?: number;
  message?: string;
  result?: T;
}
function success<T>({
  res,
  StatusCode,
  message = "Success",
  result,
}: ISuccessResponse<T>) {
  return res.status(StatusCode || 200).json({
    message,
    result,
  });
}

export default success;
