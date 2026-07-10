import { Schema, model, type HydratedDocument } from "mongoose";

export interface IContact {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type IHContact = HydratedDocument<IContact>;

const contactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true, strictQuery: true },
);

const ContactModel = model<IContact>("Contact", contactSchema);

export default ContactModel;
