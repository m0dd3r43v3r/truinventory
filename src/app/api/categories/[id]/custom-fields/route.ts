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

    const { id } = await context.params;

    const customFields = await db.customField.findMany({
      where: { categoryId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(customFields);
  } catch (error) {
    console.error("[CUSTOM_FIELDS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

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
    const fields = await request.json();

    // Get existing fields
    const existingFields = await db.customField.findMany({
      where: { categoryId: id },
      select: { id: true },
    });

    // Delete removed fields
    const existingIds = existingFields.map((f) => f.id);
    const newIds = fields.filter((f: any) => f.id).map((f: any) => f.id);
    const idsToDelete = existingIds.filter((id) => !newIds.includes(id));

    if (idsToDelete.length > 0) {
      await db.customField.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    // Update or create fields
    const updatedFields = await Promise.all(
      fields.map(async (field: any) => {
        const data = {
          name: field.name,
          type: field.type,
          required: field.required,
          options: field.options,
          categoryId: id,
        };

        if (field.id) {
          // Update existing field
          return db.customField.update({
            where: { id: field.id },
            data,
          });
        } else {
          // Create new field
          return db.customField.create({
            data,
          });
        }
      })
    );

    // Log the update
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: session.user.id,
        details: {
          type: "CATEGORY_CUSTOM_FIELDS_UPDATED",
          categoryId: id,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(updatedFields);
  } catch (error) {
    console.error("[CUSTOM_FIELDS_UPDATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 