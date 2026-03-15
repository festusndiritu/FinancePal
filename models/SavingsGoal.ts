import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISavingsGoal extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>(
  {
    userId:        { type: Schema.Types.ObjectId, required: true, index: true },
    name:          { type: String, required: true, trim: true, maxlength: 100 },
    targetAmount:  { type: Number, required: true, min: 1 },
    currentAmount: { type: Number, required: true, default: 0, min: 0 },
    deadline:      { type: Date, required: true },
    color:         { type: String, default: "#0369a1" },
  },
  { timestamps: true },
);

const SavingsGoal: Model<ISavingsGoal> =
  mongoose.models.SavingsGoal ??
  mongoose.model<ISavingsGoal>("SavingsGoal", SavingsGoalSchema);

export default SavingsGoal;