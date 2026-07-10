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

  async updateProfile(file: Express.Multer.File): Promise<CorporateProfileResponseDto> {
    if (!file) {
      throw new BadRequest("No file uploaded");
    }

    // Try to get existing profile to clean up later
    const oldProfile = await this._profileRepo.getSingleton();
    const storage = this.getStorageProvider();

    // Upload using the active Storage Provider
    const uploadResult = await storage.upload(file, "corporate-profile");

    // Clean up old file using Storage Provider
    if (oldProfile && oldProfile.storageKey) {
      try {
        await storage.delete(oldProfile.storageKey);
      } catch (err) {
        loggerService.error("Failed to delete old storage file:", err);
      }
    }

    const newProfileData = {
      storageProvider: STORAGE_PROVIDER || "cloudinary",
      storageKey: uploadResult.storageKey,
      publicUrl: uploadResult.publicUrl,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };

    const updatedProfile = await this._profileRepo.upsertSingleton(newProfileData);
    return this.mapToResponseDto(updatedProfile);
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
