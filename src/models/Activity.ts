import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityType = "TRAINING" | "MATCH";
export type ActivityStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  type: ActivityType;
  title: string;
  sport: string;
  date: Date;
  time: string; // HH:mm format, e.g. "06:30"
  endTime?: string; // HH:mm format, e.g. "08:30"
  venue?: string; // e.g. "Dumka Sports Complex Main Pitch"
  opponent?: string; // required for matches
  notes?: string;
  status: ActivityStatus;
  sessionId?: mongoose.Types.ObjectId; // ref: "Session"
  matchId?: mongoose.Types.ObjectId; // ref: "Match"
  createdBy: mongoose.Types.ObjectId; // ref: "User"
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId; // ref: "User"
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: ["TRAINING", "MATCH"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    sport: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    venue: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    opponent: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "COMPLETED", "CANCELLED"],
      required: true,
      default: "SCHEDULED",
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast calendar queries
ActivitySchema.index({ date: 1, sport: 1 });
ActivitySchema.index({ date: 1, status: 1 });
ActivitySchema.index({ type: 1, date: 1 });
ActivitySchema.index({ sessionId: 1 });
ActivitySchema.index({ matchId: 1 });

export const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);

