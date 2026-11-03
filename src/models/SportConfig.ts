import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISportConfig extends Document {
  _id: mongoose.Types.ObjectId;
  sport: string;
  scoreMetric: string;
  scoreUnit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SportConfigSchema = new Schema<ISportConfig>(
  {
    sport: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    scoreMetric: {
      type: String,
      required: true,
      trim: true,
    },
    scoreUnit: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SportConfig: Model<ISportConfig> =
  mongoose.models.SportConfig || mongoose.model<ISportConfig>("SportConfig", SportConfigSchema);
