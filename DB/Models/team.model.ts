import { Schema, model, type HydratedDocument } from "mongoose";

export interface ITeamMember {
  name: string;
  role: string;
  department: string;
  email: string;
  photo: string;
  photoKey?: string;
  description: string;
  expertise: string[];
  linkedin?: string;
}

export type IHTeamMember = HydratedDocument<ITeamMember>;

const teamMemberSchema = new Schema<ITeamMember>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    email: { type: String, required: true },
    photo: { type: String, required: true },
    photoKey: { type: String },
    description: { type: String, required: true },
    expertise: { type: [String], default: [] },
    linkedin: { type: String },
  },
  { timestamps: true, strictQuery: true },
);

const TeamModel = model<ITeamMember>("Team", teamMemberSchema);

export default TeamModel;
