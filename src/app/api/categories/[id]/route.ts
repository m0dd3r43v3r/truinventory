import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    const { name, description, customFields } = await request.json();

    // Get existing category
    const existingCategory = await db.category.findUnique({
      where: { id },
      include: { customFields: true },
    });

    if (!existingCategory) {
      return new NextResponse("Category not found", { status: 404 });
    }

    // Check if new name is already taken by another category
    if (name !== existingCategory.name) {
      const nameExists = await db.category.findUnique({
        where: { name },
      });
      if (nameExists) {
        return new NextResponse("Category name already exists", { status: 400 });
      }
    }

    // Get existing field IDs
    const existingFieldIds = existingCategory.customFields.map((f) => f.id);
    const newFieldIds = customFields.filter((f: any) => f.id).map((f: any) => f.id);
    const fieldsToDelete = existingFieldIds.filter((id) => !newFieldIds.includes(id));

    // Delete removed fields
    if (fieldsToDelete.length > 0) {
      await db.customField.deleteMany({
        where: { id: { in: fieldsToDelete } },
      });
    }

    // Update category with custom fields
    const updatedCategory = await db.category.update({
      where: { id },
      data: {
        name,
        description,
        customFields: {
          upsert: customFields.map((field: any) => ({
            where: {
              id: field.id || "new", // Use a dummy ID for new fields
            },
            create: {
              name: field.name,
              type: field.type,
              required: field.required,
              options: field.options,
            },
            update: {
              name: field.name,
              type: field.type,
              required: field.required,
              options: field.options,
            },
          })),
        },
      },
      include: {
        customFields: true,
      },
    });

    // Log the update
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: session.user.id,
        details: {
          type: "CATEGORY_UPDATED",
          categoryId: id,
          categoryName: name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("[CATEGORY_UPDATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    // Get category details for logging
    const category = await db.category.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!category) {
      return new NextResponse("Category not found", { status: 404 });
    }

    // Delete category (custom fields will be deleted automatically due to onDelete: Cascade)
    await db.category.delete({
      where: { id },
    });

    // Log the deletion
    await db.auditLog.create({
      data: {
        action: "DELETE",
        userId: session.user.id,
        details: {
          type: "CATEGORY_DELETED",
          categoryId: id,
          categoryName: category.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CATEGORY_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;

    const category = await db.category.findUnique({
      where: { id },
      include: {
        customFields: true,
        _count: {
          select: {
            items: true
          }
        }
      },
    });

    if (!category) {
      return new NextResponse("Category not found", { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("[CATEGORY_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 