import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

const settingsSchema = z.object({
  name: z.string().min(2).max(60),
  currency: z.string().trim().min(3).max(6),
  monthlyIncome: z.number().min(0),
  preferences: z.object({
    emailNotifications: z.boolean(),
    weeklySummary: z.boolean(),
    compactDashboard: z.boolean(),
  }),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  const user = await User.findById(session.user.id).lean();
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      name: user.name,
      email: user.email,
      currency: user.currency ?? "KES",
      monthlyIncome: user.monthlyIncome ?? 0,
      preferences: {
        emailNotifications: user.preferences?.emailNotifications ?? true,
        weeklySummary: user.preferences?.weeklySummary ?? true,
        compactDashboard: user.preferences?.compactDashboard ?? false,
      },
    },
  });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = settingsSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid settings payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await dbConnect();

  const updated = await User.findByIdAndUpdate(
    session.user.id,
    {
      name: parsed.data.name,
      currency: parsed.data.currency.toUpperCase(),
      monthlyIncome: parsed.data.monthlyIncome,
      preferences: parsed.data.preferences,
    },
    { new: true },
  ).lean();

  if (!updated) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
