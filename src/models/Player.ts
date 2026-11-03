import mongoose, { Schema, Document, Model } from "mongoose";
import { RegistrationStatus } from "./User";

export interface IPlayer extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  age: number;
  sport: string;
  isActive: boolean;
  registrationStatus: RegistrationStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    age: {
      type: Number,
      required: true,
      min: 5,
      max: 100,
    },
    sport: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      required: true,
      default: "PENDING",
      index: true,
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

export const Player: Model<IPlayer> =
  mongoose.models.Player || mongoose.model<IPlayer>("Player", PlayerSchema);
