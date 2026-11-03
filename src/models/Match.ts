import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMatchParticipant {
  playerId: mongoose.Types.ObjectId;
  playerNameSnapshot: string;
  score: number;
  scoreMetric: string;
  scoreUnit: string;
}

export interface IMatch extends Document {
  _id: mongoose.Types.ObjectId;
  date: Date;
  sport: string;
  opponent: string;
  sessionId: mongoose.Types.ObjectId;
  participants: IMatchParticipant[];
  status: "FINALIZED";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MatchParticipantSchema = new Schema<IMatchParticipant>(
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
    score: {
      type: Number,
      required: true,
      min: 0,
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
  },
  { _id: false }
);

const MatchSchema = new Schema<IMatch>(
  {
    date: {
      type: Date,
      required: true,
    },
    sport: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    opponent: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    participants: [MatchParticipantSchema],
    status: {
      type: String,
      enum: ["FINALIZED"],
      required: true,
      default: "FINALIZED",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

MatchSchema.index({ date: -1, sport: 1 });
MatchSchema.index({ sessionId: 1 });
MatchSchema.index({ "participants.playerId": 1, date: -1 });

export const Match: Model<IMatch> =
  mongoose.models.Match || mongoose.model<IMatch>("Match", MatchSchema);

