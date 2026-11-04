import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRosterEntry {
  playerId: mongoose.Types.ObjectId;
  playerNameSnapshot: string;
  playerSkillSnapshot?: string;
  status: "PRESENT" | "ABSENT" | null;
}

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  date: Date;
  sport: string;
  status: "OPEN" | "CLOSED";
  roster: IRosterEntry[];
  createdBy: mongoose.Types.ObjectId;
  closedBy?: mongoose.Types.ObjectId;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RosterEntrySchema = new Schema<IRosterEntry>(
  {
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    playerNameSnapshot: {
      type: String,
      required: true,
      trim: true,
    },
    playerSkillSnapshot: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PRESENT", "ABSENT", null],
      default: null,
    },
  },
  { _id: false }
);

const SessionSchema = new Schema<ISession>(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    sport: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      required: true,
      default: "OPEN",
      index: true,
    },
    roster: [RosterEntrySchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    closedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index for one session per sport/date
SessionSchema.index({ date: 1, sport: 1 }, { unique: true });
SessionSchema.index({ status: 1, date: -1 });
SessionSchema.index({ "roster.playerId": 1, sport: 1, status: 1 });

export const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
