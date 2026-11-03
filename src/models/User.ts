import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "COACH" | "PLAYER" | "SCOUT";
export type AccountStatus = "PENDING" | "ACTIVE" | "REJECTED";
export type RegistrationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  role: UserRole;
  accountStatus: AccountStatus;
  playerId?: mongoose.Types.ObjectId;
  isActive: boolean;
  registrationStatus: RegistrationStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["COACH", "PLAYER", "SCOUT"],
      required: true,
      default: "PLAYER",
    },
    accountStatus: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED"],
      required: true,
      default: "PENDING",
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: function (this: IUser) {
        return this.role === "PLAYER";
      },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
    },
    registrationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      required: true,
      default: "PENDING",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
