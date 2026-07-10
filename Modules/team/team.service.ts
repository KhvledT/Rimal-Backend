import type { CreateTeamMemberDto, UpdateTeamMemberDto } from "./team.dto.js";
import teamRepo from "../../Repo/team.repo.js";
import { NotFound, BadRequest } from "../../Common/Exeptions/domain.error.js";
import { StorageFactory } from "../../Common/Storage/storage.factory.js";
import { loggerService } from "../../Common/Logger/logger.service.js";

class TeamService {
  private _teamRepo = teamRepo;

  private getStorageProvider() {
    return StorageFactory.getProvider();
  }

  async createTeamMember(bodyData: CreateTeamMemberDto, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequest("Photo file is required");
    }

    const storage = this.getStorageProvider();
    const uploadResult = await storage.upload(file, "team");

    const memberData = {
      ...bodyData,
      photo: uploadResult.publicUrl,
      photoKey: uploadResult.storageKey,
    };

    try {
      return await this._teamRepo.create(memberData);
    } catch (dbError) {
      // Cleanup newly uploaded image if database creation fails
      try {
        await storage.delete(uploadResult.storageKey);
      } catch (cleanupErr) {
        loggerService.error(
          `Failed to delete uploaded team photo (${uploadResult.storageKey}) after database error:`,
          cleanupErr,
        );
      }
      throw dbError;
    }
  }

  async updateTeamMember(id: string, bodyData: UpdateTeamMemberDto, file?: Express.Multer.File) {
    // 1. Load existing Team member
    const teamMember = await this._teamRepo.findById({ id });
    if (!teamMember) {
      throw new NotFound("Team member not found");
    }

    // 2. Save old storage information
    const oldPhotoUrl = teamMember.photo;
    const oldPhotoKey = teamMember.photoKey;

    let photoUrl = oldPhotoUrl;
    let photoKey = oldPhotoKey;
    let newlyUploadedKey: string | undefined;

    const storage = this.getStorageProvider();

    if (file) {
      // 3. Upload new image
      const uploadResult = await storage.upload(file, "team");
      photoUrl = uploadResult.publicUrl;
      photoKey = uploadResult.storageKey;
      newlyUploadedKey = uploadResult.storageKey;
    }

    const updatedData = {
      ...bodyData,
      photo: photoUrl,
      photoKey: photoKey,
    };

    try {
      // 4. Update database
      const result = await this._teamRepo.findOneAndUpdate({
        filter: { _id: id },
        update: updatedData,
      });

      // 5. Delete old image from the active storage provider only after database update succeeds
      if (file && oldPhotoKey) {
        try {
          await storage.delete(oldPhotoKey);
        } catch (err) {
          loggerService.error(
            `Failed to delete old team member photo (${oldPhotoKey}):`,
            err,
          );
        }
      }

      return result;
    } catch (dbError) {
      // Cleanup newly uploaded image if database update fails
      if (newlyUploadedKey) {
        try {
          await storage.delete(newlyUploadedKey);
        } catch (cleanupErr) {
          loggerService.error(
            `Failed to clean up newly uploaded team photo (${newlyUploadedKey}) after database error:`,
            cleanupErr,
          );
        }
      }
      throw dbError;
    }
  }

  async deleteTeamMember(id: string) {
    // 1. Load Team member
    const teamMember = await this._teamRepo.findById({ id });
    if (!teamMember) {
      throw new NotFound("Team member not found");
    }

    const storage = this.getStorageProvider();

    // 2. Delete image from storage
    if (teamMember.photoKey) {
      try {
        await storage.delete(teamMember.photoKey);
      } catch (err) {
        loggerService.error(
          `Failed to delete team member photo (${teamMember.photoKey}) during deletion:`,
          err,
        );
      }
    }

    // 3. Delete database document
    await this._teamRepo.deleteOne({ filter: { _id: id } });
    return teamMember;
  }

  async listTeamMembers() {
    return await this._teamRepo.find({ filter: {}, lean: true });
  }
}

export default new TeamService();
