import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return new NextResponse("Email is required", { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("[CHECK_EMAIL_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 