import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import { Readable } from "node:stream";
import https from "node:https";
import type { IStorageProvider } from "../storage.interface.js";
import { BadRequest } from "../../../Common/Exeptions/domain.error.js";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../../../config/config.service.js";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export class CloudinaryStorageProvider implements IStorageProvider {
  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ publicUrl: string; storageKey: string }> {
    if (!file?.buffer) {
      throw new BadRequest("No file buffer found");
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          if (!result) {
            return reject(new BadRequest("Upload failed"));
          }

          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    // Store a composite key: public_id and resource_type separated by a colon
    const storageKey = `${result.public_id}:${result.resource_type}`;

    return {
      publicUrl: result.secure_url,
      storageKey,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const [publicId, resourceType] = storageKey.split(":");
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || "auto",
    });
  }

  getPublicUrl(storageKey: string): string {
    const [publicId, resourceType] = storageKey.split(":");
    return cloudinary.url(publicId, {
      resource_type: resourceType || "auto",
      secure: true,
    });
  }

  async download(storageKey: string): Promise<Readable> {
    const url = this.getPublicUrl(storageKey);
    return new Promise<Readable>((resolve, reject) => {
      https
        .get(url, (res) => {
          if (res.statusCode !== 200) {
            return reject(
              new BadRequest("Failed to download file from Cloudinary"),
            );
          }
          resolve(res);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  async exists(storageKey: string): Promise<boolean> {
    const [publicId, resourceType] = storageKey.split(":");
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType || "image",
      });
      return !!result;
    } catch {
      return false;
    }
  }
}
