import userRepo from "../../Repo/user.repo.js";
import { RoleEnum } from "../../enums/user.enums.js";
import {
  NotFound,
  BadRequest,
} from "../../Common/Exeptions/domain.error.js";
import type { UserResponseDto } from "./admin.dto.js";

class AdminService {
  private _userRepo = userRepo;

  private mapToUserDto(user: any): UserResponseDto {
    return {
      id: user._id.toString(),
      userName: user.userName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  async listUsers(): Promise<UserResponseDto[]> {
    const users = await this._userRepo.find({
      filter: { role: RoleEnum.User },
      lean: true,
    });
    return users.map((u) => this.mapToUserDto(u));
  }

  async listAdmins(): Promise<UserResponseDto[]> {
    const admins = await this._userRepo.find({
      filter: { role: RoleEnum.Admin },
      lean: true,
    });
    return admins.map((a) => this.mapToUserDto(a));
  }

  async promoteUser(id: string): Promise<UserResponseDto> {
    const user = await this._userRepo.findById({ id });
    if (!user) {
      throw new NotFound("User not found");
    }

    if (user.role === RoleEnum.Admin || user.role === RoleEnum.SuperAdmin) {
      throw new BadRequest("User is already an Admin or Super Admin");
    }

    user.role = RoleEnum.Admin;
    await user.save();

    return this.mapToUserDto(user);
  }

  async demoteAdmin(id: string): Promise<UserResponseDto> {
    const user = await this._userRepo.findById({ id });
    if (!user) {
      throw new NotFound("Admin not found");
    }

    if (user.role === RoleEnum.User) {
      throw new BadRequest("Target account is already a regular User");
    }

    // Safety checks for Super Admin demotion
    if (user.role === RoleEnum.SuperAdmin) {
      const superAdminCount = await this._userRepo.find({
        filter: { role: RoleEnum.SuperAdmin },
        lean: true,
      });

      if (superAdminCount.length <= 1) {
        throw new BadRequest("Cannot demote the last Super Admin account");
      }
    }

    user.role = RoleEnum.User;
    await user.save();

    return this.mapToUserDto(user);
  }
}

export default new AdminService();
