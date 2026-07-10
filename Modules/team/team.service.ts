import type { CreateTeamMemberDto, UpdateTeamMemberDto } from "./team.dto.js";
import teamRepo from "../../Repo/team.repo.js";
import { NotFound, BadRequest } from "../../Common/Exeptions/domain.error.js";
import { uploadSmallFileToCloudinary } from "../../Common/Cloudinary/cloudinary.service.js";

class TeamService {
  private _teamRepo = teamRepo;

  async createTeamMember(bodyData: CreateTeamMemberDto, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequest("Photo file is required");
    }

    const uploadResult = await uploadSmallFileToCloudinary(file, "team");
    const photoUrl = uploadResult.secureUrl;
    
    const memberData = {
      ...bodyData,
      photo: photoUrl,
    };

    return await this._teamRepo.create(memberData);
  }

  async updateTeamMember(id: string, bodyData: UpdateTeamMemberDto, file?: Express.Multer.File) {
    const teamMember = await this._teamRepo.findById({ id });
    if (!teamMember) {
      throw new NotFound("Team member not found");
    }

    let photoUrl = teamMember.photo;
    if (file) {
      const uploadResult = await uploadSmallFileToCloudinary(file, "team");
      photoUrl = uploadResult.secureUrl;
    }

    const updatedData = {
      ...bodyData,
      photo: photoUrl,
    };

    return await this._teamRepo.findOneAndUpdate({
      filter: { _id: id },
      update: updatedData,
    });
  }

  async deleteTeamMember(id: string) {
    const teamMember = await this._teamRepo.findById({ id });
    if (!teamMember) {
      throw new NotFound("Team member not found");
    }
    await this._teamRepo.deleteOne({ filter: { _id: id } });
    return teamMember;
  }

  async listTeamMembers() {
    return await this._teamRepo.find({ filter: {} });
  }
}

export default new TeamService();
