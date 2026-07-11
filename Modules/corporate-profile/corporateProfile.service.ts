import { randomUUID } from "node:crypto";
import corporateProfileRepo from "../../Repo/corporateProfile.repo.js";
import { NotFound, BadRequest } from "../../Common/Exeptions/domain.error.js";
import { StorageFactory } from "../../Common/Storage/storage.factory.js";
import { STORAGE_PROVIDER } from "../../config/config.service.js";
import type { CorporateProfileResponseDto } from "./corporateProfile.dto.js";
import { loggerService } from "../../Common/Logger/logger.service.js";

class CorporateProfileService {
  private _profileRepo = corporateProfileRepo;

  private getStorageProvider() {
    return StorageFactory.getProvider();
  }

  private mapToResponseDto(doc: any): CorporateProfileResponseDto {
    return {
      previewUrl: doc.publicUrl,
      originalFilename: doc.originalFilename,
      mimeType: doc.mimeType,
      size: doc.size,
      updatedAt: doc.updatedAt,
    };
  }

  async getProfile(): Promise<CorporateProfileResponseDto> {
    const profile = await this._profileRepo.getSingleton();
    if (!profile) {
      throw new NotFound("Corporate profile has not been uploaded yet");
    }
    return this.mapToResponseDto(profile);
  }

  async getProfileForDownload() {
    const profile = await this._profileRepo.getSingleton();
    if (!profile) {
      throw new NotFound("Corporate profile has not been uploaded yet");
    }

    const storage = this.getStorageProvider();
    const stream = await storage.download(profile.storageKey);

    return {
      stream,
      originalFilename: profile.originalFilename,
      mimeType: profile.mimeType,
    };
  }

  async generateUploadUrl() {
    const storageKey = `corporate-profile/${randomUUID()}.pdf`;
    const storage = this.getStorageProvider();
    // Generate signed upload URL expiring in 10 minutes (600 seconds)
    const uploadUrl = await storage.generateSignedUploadUrl(storageKey, 600);

    return {
      uploadUrl,
      storageKey,
    };
  }

  async updateProfileMetadata(body: {
    storageKey: string;
    originalFilename: string;
    mimeType: string;
    size: number;
  }): Promise<CorporateProfileResponseDto> {
    const { storageKey, originalFilename, mimeType, size } = body;

    // 1. Validation
    if (!storageKey || !originalFilename || !mimeType || !size) {
      throw new BadRequest("Missing required profile metadata parameters");
    }

    if (mimeType !== "application/pdf") {
      throw new BadRequest("Invalid file type. Only PDF format is allowed.");
    }

    if (!storageKey.startsWith("corporate-profile/")) {
      throw new BadRequest("Invalid storage key path prefix");
    }

    const storage = this.getStorageProvider();

    // 2. Verify file exists on Supabase / active storage provider
    const exists = await storage.exists(storageKey);
    if (!exists) {
      throw new BadRequest("The uploaded file does not exist in storage");
    }

    // 3. Retrieve public URL
    const publicUrl = storage.getPublicUrl(storageKey);

    // 4. Retrieve existing profile to clean up later
    const oldProfile = await this._profileRepo.getSingleton();

    const newProfileData = {
      storageProvider: STORAGE_PROVIDER || "supabase",
      storageKey,
      publicUrl,
      originalFilename,
      mimeType,
      size,
    };

    try {
      // 5. Save metadata into MongoDB
      const updatedProfile = await this._profileRepo.upsertSingleton(
        newProfileData,
      );

      // 6. Delete previous profile from active storage provider if exists
      if (oldProfile && oldProfile.storageKey) {
        try {
          await storage.delete(oldProfile.storageKey);
        } catch (err) {
          loggerService.error(
            "Failed to delete old profile file from storage:",
            err,
          );
        }
      }

      return this.mapToResponseDto(updatedProfile);
    } catch (dbError) {
      // Clean up newly uploaded file to avoid orphaned storage if DB insertion fails
      try {
        await storage.delete(storageKey);
      } catch (cleanupErr) {
        loggerService.error(
          "Failed to clean up newly uploaded file after database insertion error:",
          cleanupErr,
        );
      }
      throw dbError;
    }
  }

  async deleteProfile(): Promise<CorporateProfileResponseDto> {
    const profile = await this._profileRepo.getSingleton();
    if (!profile) {
      throw new NotFound("Corporate profile not found");
    }

    const storage = this.getStorageProvider();
    if (profile.storageKey) {
      await storage.delete(profile.storageKey);
    }

    await this._profileRepo.deleteOne({ filter: { _id: profile._id } });
    return this.mapToResponseDto(profile);
  }
}

export default new CorporateProfileService();
export { CorporateProfileService };
