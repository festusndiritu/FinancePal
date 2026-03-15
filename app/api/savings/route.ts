import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import SavingsGoal from "@/models/SavingsGoal";

const goalSchema = z.object({
  name:          z.string().min(1).max(100).optional(),
  targetAmount:  z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline:      z.string().datetime().or(z.string().date()).optional(),
  color:         z.string().optional(),
});

const createSchema = goalSchema.required({ name: true }).extend({
  name:          z.string().min(1).max(100),
  targetAmount:  z.number().positive(),
  currentAmount: z.number().min(0).default(0),
  deadline:      z.string().datetime().or(z.string().date()),
  color:         z.string().default("#0369a1"),
});

// Accept both `id` and `goalId` so the chat route doesn't need special casing
const updateSchema = goalSchema.extend({
  id:     z.string().min(1).optional(),
  goalId: z.string().min(1).optional(),
}).refine((d) => d.id ?? d.goalId, { message: "id or goalId required" });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const goals = await SavingsGoal.find({ userId: session.user.id })
    .sort({ deadline: 1 }).lean();

  return NextResponse.json({
    data: goals.map((g) => ({
      _id:             g._id.toString(),
      name:            g.name,
      targetAmount:    g.targetAmount,
      currentAmount:   g.currentAmount,
      deadline:        g.deadline.toISOString(),
      color:           g.color,
      progressPercent: g.targetAmount > 0
        ? Math.min((g.currentAmount / g.targetAmount) * 100, 100)
        : 0,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  await dbConnect();

  const created = await SavingsGoal.create({ ...parsed.data, userId: session.user.id });

  return NextResponse.json({
    data: {
      _id:             created._id.toString(),
      name:            created.name,
      targetAmount:    created.targetAmount,
      currentAmount:   created.currentAmount,
      deadline:        created.deadline.toISOString(),
      color:           created.color,
      progressPercent: 0,
    },
  }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  // Support both `id` and `goalId`
  const rawId = parsed.data.id ?? parsed.data.goalId;
  if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name          !== undefined) updateData.name          = parsed.data.name;
  if (parsed.data.targetAmount  !== undefined) updateData.targetAmount  = parsed.data.targetAmount;
  if (parsed.data.currentAmount !== undefined) updateData.currentAmount = parsed.data.currentAmount;
  if (parsed.data.deadline      !== undefined) updateData.deadline      = new Date(parsed.data.deadline);
  if (parsed.data.color         !== undefined) updateData.color         = parsed.data.color;

  const updated = await SavingsGoal.findOneAndUpdate(
    { _id: rawId, userId: session.user.id },
    updateData,
    { new: true },
  ).lean();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    data: {
      _id:             updated._id.toString(),
      name:            updated.name,
      targetAmount:    updated.targetAmount,
      currentAmount:   updated.currentAmount,
      deadline:        updated.deadline.toISOString(),
      color:           updated.color,
      progressPercent: updated.targetAmount > 0
        ? Math.min((updated.currentAmount / updated.targetAmount) * 100, 100)
        : 0,
    },
  });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await dbConnect();

  const deleted = await SavingsGoal.findOneAndDelete({ _id: id, userId: session.user.id }).lean();
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}