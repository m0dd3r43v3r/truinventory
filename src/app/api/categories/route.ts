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

    const categories = await db.category.findMany({
      include: {
        customFields: true,
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("[CATEGORIES_GET_ERROR]", error instanceof Error ? error.message : String(error));
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, description, customFields } = await req.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Check if category already exists
    const existingCategory = await db.category.findUnique({
      where: { name },
    });

    if (existingCategory) {
      return new NextResponse("Category already exists", { status: 400 });
    }

    // Create category with custom fields
    const category = await db.category.create({
      data: {
        name,
        description,
        customFields: {
          create: customFields.map((field: any) => ({
            name: field.name,
            type: field.type,
            required: field.required,
            options: field.options,
          })),
        },
      },
      include: {
        customFields: true,
      },
    });

    // Log the creation
    await db.auditLog.create({
      data: {
        action: "CREATE",
        userId: session.user.id,
        details: {
          type: "CATEGORY_CREATED",
          categoryId: category.id,
          categoryName: category.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 