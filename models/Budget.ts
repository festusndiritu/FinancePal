import { model, models, Schema, type InferSchemaType } from "mongoose";

const BudgetSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    limit: {
      type: Number,
      required: true,
      min: 0,
    },
    period: {
      type: String,
      enum: ["monthly", "weekly"],
      default: "monthly",
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
    },
  },
  {
    timestamps: true,
  },
);

export type BudgetDocument = InferSchemaType<typeof BudgetSchema>;

const Budget = models.Budget || model("Budget", BudgetSchema);

export default Budget;
