import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import { BadRequest } from "../Exeptions/domain.error.js";
import {
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_CLOUD_NAME,
} from "../../config/config.service.js";

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResponse {
  secureUrl: string;
  publicId: string;
  resourceType: string;
}

// SMALL FILES MAX: 100MB
export async function uploadSmallFileToCloudinary(
  file: Express.Multer.File,
  folder: string,
): Promise<CloudinaryUploadResponse> {
  try {
    if (!file?.buffer) {
      throw new BadRequest("No file buffer found");
    }

    const MAX_SIZE = 100 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      throw new BadRequest("File size exceeds 100MB limit");
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

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error("Small File Upload Error:", error);
    throw error;
  }
}

// LARGE FILES MAX: 3GB
export async function uploadLargeFileToCloudinary(
  file: Express.Multer.File,
  folder: string,
): Promise<CloudinaryUploadResponse> {
  try {
    if (!file?.buffer) {
      throw new BadRequest("No file buffer found");
    }

    const MAX_SIZE = 3 * 1024 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      throw new BadRequest("File size exceeds 3GB limit");
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_large_stream(
        {
          folder,
          resource_type: "auto",
          chunk_size: 20 * 1024 * 1024,
          timeout: 1000 * 60 * 30,
        },
        (error, result) => {
          if (error) {
            return reject(new BadRequest("Failed to upload large file"));
          }

          if (!result) {
            return reject(new BadRequest("Large upload failed"));
          }

          resolve(result);
        },
      );

      streamifier
        .createReadStream(file.buffer, {
          highWaterMark: 10 * 1024 * 1024,
        })
        .pipe(uploadStream);
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
    };
  } catch (error) {
    console.error("Large File Upload Error:", error);
    throw error;
  }
}

export async function uploadSmallFilesToCloudinary(
  Files: Express.Multer.File[],
  folder: string,
): Promise<CloudinaryUploadResponse[]> {
  const uploadResults = await Promise.all(
    Files.map((file) => uploadSmallFileToCloudinary(file, folder)),
  );
  return uploadResults;
}

export async function uploadLargeFilesToCloudinary(
  Files: Express.Multer.File[],
  folder: string,
): Promise<CloudinaryUploadResponse[]> {
  const uploadResults = await Promise.all(
    Files.map((file) => uploadLargeFileToCloudinary(file, folder)),
  );
  return uploadResults;
}

export async function deleteFileFromCloudinary(publicId: string, resourceType: string) {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.log(error);
  }
}

export function generatePreviewUrl(publicId: string, resourceType: string): string {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
  });
}

export function generateDownloadUrl(
  publicId: string,
  resourceType: string,
  originalFilename: string,
): string {
  const extIndex = originalFilename.lastIndexOf(".");
  const baseName =
    extIndex !== -1 ? originalFilename.substring(0, extIndex) : originalFilename;
  const safeBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true,
    flags: `attachment:${safeBaseName}`,
  });
}
