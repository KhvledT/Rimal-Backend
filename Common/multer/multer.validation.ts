import type { Request, Response, NextFunction } from "express";
import type { FileFilterCallback } from "multer";
import { BadRequest } from "../Exeptions/domain.error.js";
import { fileTypeFromBuffer } from "file-type";

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

export function validateFileBuffer(allowedFormats: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate single file (req.file)
      if (req.file && req.file.buffer) {
        const detected = await fileTypeFromBuffer(req.file.buffer);
        const mime = detected ? detected.mime : req.file.mimetype;
        if (!allowedFormats.includes(mime)) {
          return next(new BadRequest("invalid formate"));
        }
      }

      // Validate multiple files (req.files)
      if (req.files) {
        const filesArray = Array.isArray(req.files)
          ? req.files
          : Object.values(req.files).flat();

        for (const file of filesArray) {
          if (file.buffer) {
            const detected = await fileTypeFromBuffer(file.buffer);
            const mime = detected ? detected.mime : file.mimetype;
            if (!allowedFormats.includes(mime)) {
              return next(new BadRequest("invalid formate"));
            }
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
