import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  if (!process.env.MONGODB_URI) {
    return NextResponse.json(
      {
        error: "Server setup incomplete: set MONGODB_URI before registering users",
      },
      { status: 503 },
    );
  }

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid registration payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  await dbConnect();

  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    return NextResponse.json(
      { error: "An account with that email already exists" },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return NextResponse.json(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    { status: 201 },
  );
}
