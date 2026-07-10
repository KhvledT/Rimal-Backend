import type { RoleEnum } from "../../enums/user.enums.js";

export interface UserResponseDto {
  id: string;
  userName: string;
  email: string;
  phone?: string;
  role: RoleEnum;
  createdAt: Date;
}
