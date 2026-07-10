import { Schema, model, type HydratedDocument } from "mongoose";

export interface IContactInfo {
  address: string;
  emails: string[];
  phones: string[];
  linkedIn: string;
  mapUrl: string;
  isSingleton?: boolean;
}

export type IHContactInfo = HydratedDocument<IContactInfo>;

const contactInfoSchema = new Schema<IContactInfo>(
  {
    address: { type: String, required: true },
    emails: { type: [String], required: true },
    phones: { type: [String], required: true },
    linkedIn: { type: String, required: true },
    mapUrl: { type: String, required: true },
    isSingleton: { type: Boolean, default: true, unique: true },
  },
  { timestamps: true, strictQuery: true },
);

const ContactInfoModel = model<IContactInfo>("ContactInfo", contactInfoSchema);

export default ContactInfoModel;
