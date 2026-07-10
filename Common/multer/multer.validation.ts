import type { Request } from "express";
import type { FileFilterCallback } from "multer";
import { BadRequest } from "../Exeptions/domain.error.js";

export const allowedFileFormats = {
  img: ["image/png", "image/jpg", "image/jpeg", "image/webp"],
  video: ["video/mp4"],
  pdf: ["application/pdf"],
};

export function fileFilter(allowedFormate: string[]) {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!allowedFormate.includes(file.mimetype)) {
      return cb(new BadRequest("invalid formate"));
    }

    return cb(null, true);
  };
}
