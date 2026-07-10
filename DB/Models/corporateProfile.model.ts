import { Schema, model, type HydratedDocument } from "mongoose";

export interface ICorporateProfile {
  storageProvider: string;
  storageKey: string;
  publicUrl: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  isSingleton?: boolean;
}

export type IHCorporateProfile = HydratedDocument<ICorporateProfile>;

const corporateProfileSchema = new Schema<ICorporateProfile>(
  {
    storageProvider: { type: String, required: true },
    storageKey: { type: String, required: true },
    publicUrl: { type: String, required: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    isSingleton: { type: Boolean, default: true, unique: true },
  },
  { timestamps: true, strictQuery: true },
);

const CorporateProfileModel = model<ICorporateProfile>("CorporateProfile", corporateProfileSchema);

export default CorporateProfileModel;
