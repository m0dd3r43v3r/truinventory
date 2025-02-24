import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get itemId from query params if it exists
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");

    // Build where clause
    const where = {
      ...(itemId ? { itemId } : {}),
      // If not admin, only show logs for items
      ...(!session.user.role.includes("ADMIN") ? { 
        NOT: {
          itemId: null
        }
      } : {})
    };

    const logs = await db.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("[AUDIT_LOGS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 