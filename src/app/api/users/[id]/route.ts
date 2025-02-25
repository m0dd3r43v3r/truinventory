import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function PATCH(
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

    const body = await req.json();
    const { role } = body;

    if (!role) {
      return new NextResponse("Role is required", { status: 400 });
    }

    // Validate role
    const validRoles = ["ADMIN", "EDITOR", "READ_ONLY", "USER"];
    if (!validRoles.includes(role)) {
      return new NextResponse(`Invalid role. Must be one of: ${validRoles.join(", ")}`, { status: 400 });
    }

    // Don't allow changing your own role
    if (id === session.user.id) {
      return new NextResponse("Cannot change your own role", { status: 400 });
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Log the role change
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: session.user.id,
        details: {
          type: "USER_ROLE_UPDATED",
          targetUserId: id,
          targetUserEmail: updatedUser.email,
          oldRole: body.oldRole || "Unknown",
          newRole: role,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_UPDATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

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