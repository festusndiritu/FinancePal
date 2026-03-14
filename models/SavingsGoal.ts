import { model, models, Schema, type InferSchemaType } from "mongoose";

const SavingsGoalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
      required: true,
    },
    color: {
      type: String,
      default: "#0ea5e9",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export type SavingsGoalDocument = InferSchemaType<typeof SavingsGoalSchema>;

const SavingsGoal =
  models.SavingsGoal || model("SavingsGoal", SavingsGoalSchema);

export default SavingsGoal;
