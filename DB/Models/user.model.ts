import { Schema, model, type HydratedDocument } from "mongoose";
import { RoleEnum } from "../../enums/user.enums.js";
import { hashOperation } from "../../Common/security/hash.js";
import { encrptValue } from "../../Common/security/encrypt.js";

export interface IUser {
  userName: string;
  email: string;
  password: string;
  phone: string;
  role: RoleEnum;
  deletedAt: Date | null;
}

export type IHUser = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    role: { type: Number, enum: RoleEnum, default: RoleEnum.User },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, strictQuery: true },
);

userSchema.index({ userName: 1 });
userSchema.index({ role: 1 });
userSchema.index({ email: 1, role: 1 });


userSchema.pre("save", async function (this: IHUser & { wasNew: boolean }) {
  this.wasNew = this.isNew;
  if (this.isModified("password")) {
    this.password = await hashOperation({ plainText: this.password });
  }

  if (this.phone && this.isModified("phone")) {
    this.phone = encrptValue({ value: this.phone });
  }
});

userSchema.pre(["findOne", "find"], function () {
  const query = this.getQuery();
  if (query?.paranoid == true) {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});

const UserModel = model<IUser>("User", userSchema);

export default UserModel;
