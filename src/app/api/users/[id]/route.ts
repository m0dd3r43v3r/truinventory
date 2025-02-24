import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const id = params.id;

    if (!id) {
      return new NextResponse("Missing user ID", { status: 400 });
    }

    // Don't allow deleting yourself
    if (id === session.user.id) {
      return new NextResponse("Cannot delete your own account", { status: 400 });
    }

    // Delete user's accounts first (due to foreign key constraints)
    await db.account.deleteMany({
      where: { userId: id },
    });

    // Delete user's sessions
    await db.session.deleteMany({
      where: { userId: id },
    });

    // Delete user's audit logs
    await db.auditLog.deleteMany({
      where: { userId: id },
    });

    // Finally delete the user
    const user = await db.user.delete({
      where: { id },
      select: {
        id: true,
        email: true,
      },
    });

    // Log the deletion
    await db.auditLog.create({
      data: {
        action: "DELETE",
        userId: session.user.id,
        details: {
          type: "USER_DELETED",
          targetUserId: id,
          targetUserEmail: user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 