import { Schema, model, type HydratedDocument, Types } from "mongoose";

export interface ISession {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  accessTokenJti: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  lastActivity: Date;
  lastUsedAt?: Date;
  /** IP address captured on the most recent successful refresh */
  lastIp?: string;
  /** User-Agent captured on the most recent successful refresh */
  lastUserAgent?: string;
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
}

export type IHSession = HydratedDocument<ISession>;

const sessionSchema = new Schema<ISession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refreshTokenHash: { type: String, required: true },
    accessTokenJti: { type: String, required: true, unique: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    device: { type: String },
    lastActivity: { type: Date, default: Date.now },
    lastUsedAt: { type: Date },
    lastIp: { type: String },
    lastUserAgent: { type: String },
    expiresAt: { type: Date, required: true },
    isRevoked: { type: Boolean, default: false },
    revokedAt: { type: Date },
  },
  { timestamps: true, strictQuery: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, isRevoked: 1 });
sessionSchema.index({ refreshTokenHash: 1 });

const SessionModel = model<ISession>("Session", sessionSchema);

export default SessionModel;
