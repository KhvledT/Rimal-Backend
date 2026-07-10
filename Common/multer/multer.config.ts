import multer from "multer";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { allowedFileFormats, fileFilter } from "./multer.validation.js";
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

  return multer({
    storage,
    fileFilter: fileFilter(allowedFormats),
    limits: { fieldSize: fileSize * 1024 * 1024 },
  });
}

export default cloudFileUpload;
