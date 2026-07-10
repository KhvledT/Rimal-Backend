import multer from "multer";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import {
  allowedFileFormats,
  fileFilter,
  validateFileBuffer,
} from "./multer.validation.js";
import { StorageApproachEnum } from "../../enums/multer.enum.js";

function cloudFileUpload({
  storageApproach = StorageApproachEnum.Memory,
  allowedFormats = allowedFileFormats.img,
  fileSize = 100,
}: {
  storageApproach?: StorageApproachEnum;
  allowedFormats?: string[];
  fileSize?: number;
}) {
  const storage =
    storageApproach === StorageApproachEnum.Memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: (req, file, cb) => {
            cb(null, tmpdir());
          },
          filename: (req, file, cb) => {
            cb(null, `${randomUUID()}-${file.originalname}`);
          },
        });

  const upload = multer({
    storage,
    fileFilter: fileFilter(allowedFormats),
    limits: { fileSize: fileSize * 1024 * 1024 },
  });

  return {
    single: (fieldName: string) => {
      return [upload.single(fieldName), validateFileBuffer(allowedFormats)];
    },
    array: (fieldName: string, maxCount?: number) => {
      return [
        upload.array(fieldName, maxCount),
        validateFileBuffer(allowedFormats),
      ];
    },
    fields: (fields: { name: string; maxCount?: number }[]) => {
      return [upload.fields(fields), validateFileBuffer(allowedFormats)];
    },
    any: () => {
      return [upload.any(), validateFileBuffer(allowedFormats)];
    },
    none: () => {
      return upload.none();
    },
  };
}

export default cloudFileUpload;
