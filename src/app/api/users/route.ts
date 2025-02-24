import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();

    const users = await db.user.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("[USERS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { email, password, name, role } = await req.json();

    // Validate input
    if (!email || !password || !name) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User already exists", { status: 400 });
    }

    // Create user
    const hashedPassword = await hash(password, 12);
    const userData: Prisma.UserCreateInput = {
      email,
      name,
      password: hashedPassword,
      role: role || "USER",
    };

    const user = await db.user.create({
      data: userData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Log the creation
    await db.auditLog.create({
      data: {
        action: "CREATE",
        userId: session.user.id,
        details: {
          type: "USER_CREATED",
          targetUserId: user.id,
          targetUserEmail: user.email,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[USER_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id, role, name, email, password } = await req.json();

    // Don't allow changing your own role
    if (id === session.user.id && role) {
      return new NextResponse("Cannot change your own role", { status: 400 });
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (role) updateData.role = role;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await hash(password, 12);

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Log the update
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: session.user.id,
        details: {
          type: "USER_UPDATED",
          targetUserId: id,
          updatedFields: Object.keys(updateData),
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

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing user ID", { status: 400 });
    }

    // Don't allow deleting yourself
    if (id === session.user.id) {
      return new NextResponse("Cannot delete your own account", { status: 400 });
    }

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