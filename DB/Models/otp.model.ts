import { Schema, model, type HydratedDocument } from "mongoose";

export enum OtpPurposeEnum {
  SIGNUP = "SIGNUP",
}

export interface IOtp {
  email: string;
  codeHash: string;
  purpose: OtpPurposeEnum;
  expiresAt: Date;
  attempts: number;
  isUsed: boolean;
}

export type IHOtp = HydratedDocument<IOtp>;

const otpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true },
    codeHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: Object.values(OtpPurposeEnum),
      required: true,
    },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true, strictQuery: true },
);

// Index to automatically expire OTP documents after expiresAt has passed
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1 });
otpSchema.index({ email: 1, purpose: 1 });

const OtpModel = model<IOtp>("Otp", otpSchema);

export default OtpModel;
