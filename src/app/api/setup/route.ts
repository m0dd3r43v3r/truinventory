import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // Check if any user exists
    const userCount = await db.user.count();
    if (userCount > 0) {
      return new NextResponse("Setup has already been completed", { status: 400 });
    }

    const { email, password, name } = await req.json();

    // Validate input
    if (!email || !password || !name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Create admin user
    const hashedPassword = await hash(password, 12);
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[SETUP_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const userCount = await db.user.count();
    return NextResponse.json({ setupRequired: userCount === 0 });
  } catch (error) {
    console.error("[SETUP_CHECK_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 