export interface CreateTeamMemberDto {
  name: string;
  role: string;
  department: string;
  email: string;
  photo?: string;
  description: string;
  expertise: string[];
  linkedin?: string;
}

export interface UpdateTeamMemberDto {
  name?: string;
  role?: string;
  department?: string;
  email?: string;
  photo?: string;
  description?: string;
  expertise?: string[];
  linkedin?: string;
}
