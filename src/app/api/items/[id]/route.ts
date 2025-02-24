import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await the params object before accessing its properties
    const { id } = await context.params;

    const item = await db.item.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            customFields: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!item) {
      return new NextResponse("Item not found", { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("[ITEM_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await context.params;
    const { name, description, quantity, categoryId, locationId, customFields } = await request.json();

    // Get the current item for audit logging
    const currentItem = await db.item.findUnique({
      where: { id },
      select: {
        name: true,
        description: true,
        quantity: true,
        categoryId: true,
        locationId: true,
        customFields: true,
      },
    });

    if (!currentItem) {
      return new NextResponse("Item not found", { status: 404 });
    }

    // If category is being changed, validate new custom fields
    if (categoryId && categoryId !== currentItem.categoryId) {
      const category = await db.category.findUnique({
        where: { id: categoryId },
        include: { customFields: true },
      });

      if (!category) {
        return new NextResponse("Category not found", { status: 404 });
      }

      // Validate required custom fields
      const missingRequiredFields = category.customFields
        .filter(field => field.required)
        .filter(field => !customFields || !customFields[field.id]);

      if (missingRequiredFields.length > 0) {
        return new NextResponse(
          `Missing required custom fields: ${missingRequiredFields.map(f => f.name).join(", ")}`,
          { status: 400 }
        );
      }
    }

    // Update item
    const updatedItem = await db.item.update({
      where: { id },
      data: {
        name,
        description,
        quantity,
        categoryId,
        locationId,
        customFields,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            customFields: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
    });

    // Log the update
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: session.user.id,
        itemId: id,
        details: {
          type: "ITEM_UPDATED",
          changes: {
            name: name !== currentItem.name ? { from: currentItem.name, to: name } : undefined,
            description: description !== currentItem.description ? { from: currentItem.description, to: description } : undefined,
            quantity: quantity !== currentItem.quantity ? { from: currentItem.quantity, to: quantity } : undefined,
            categoryId: categoryId !== currentItem.categoryId ? { from: currentItem.categoryId, to: categoryId } : undefined,
            locationId: locationId !== currentItem.locationId ? { from: currentItem.locationId, to: locationId } : undefined,
            customFields: JSON.stringify(customFields) !== JSON.stringify(currentItem.customFields) ? { from: currentItem.customFields, to: customFields } : undefined,
          },
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("[ITEM_UPDATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 