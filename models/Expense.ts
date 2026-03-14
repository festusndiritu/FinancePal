import { model, models, Schema, type InferSchemaType } from "mongoose";

const expenseCategories = [
  "food",
  "transport",
  "utilities",
  "rent",
  "education",
  "entertainment",
  "health",
  "shopping",
  "savings",
  "other",
] as const;

const ExpenseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: expenseCategories,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ["chatbot", "manual"],
      default: "manual",
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export type ExpenseDocument = InferSchemaType<typeof ExpenseSchema>;

const Expense = models.Expense || model("Expense", ExpenseSchema);

export default Expense;
