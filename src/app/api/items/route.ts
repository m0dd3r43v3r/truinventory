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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase();
    const categoryId = searchParams.get("categoryId");
    const locationId = searchParams.get("locationId");
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // If locationId is provided, get all child locations
    let locationIds: string[] = [];
    if (locationId) {
      const location = await db.location.findUnique({
        where: { id: locationId },
        select: { path: true },
      });

      if (location) {
        // Find all locations that have a path starting with the selected location's path
        const childLocations = await db.location.findMany({
          where: {
            OR: [
              { id: locationId }, // Include the selected location
              { path: { startsWith: `${location.path}${locationId}/` } }, // Include child locations
            ],
          },
          select: { id: true },
        });
        locationIds = childLocations.map(loc => loc.id);
      }
    }

    // Build the where clause for filtering
    const whereClause = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        categoryId ? { categoryId } : {},
        locationId ? { locationId: { in: locationIds } } : {},
      ],
    };

    // Get total count for pagination
    const totalItems = await db.item.count({
      where: whereClause,
    });

    // Get paginated items
    const items = await db.item.findMany({
      where: whereClause,
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
            parent: {
              select: {
                name: true
              }
            }
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    });

    // Return items with pagination metadata
    return NextResponse.json({
      items,
      pagination: {
        total: totalItems,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
      }
    });
  } catch (error) {
    console.error("[ITEMS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, description, quantity, categoryId, locationId, customFields } = await req.json();

    // Validate input
    if (!name || !categoryId || !locationId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Get category to validate custom fields
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

    // Generate QR code
    const qrCode = `ITEM-${Date.now()}`;

    // Create item
    const item = await db.item.create({
      data: {
        name,
        description,
        quantity: quantity || 0,
        categoryId,
        locationId,
        qrCode,
        customFields,
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
    });

    // Log the creation
    await db.auditLog.create({
      data: {
        action: "CREATE",
        userId: session.user.id,
        itemId: item.id,
        details: {
          type: "ITEM_CREATED",
          itemName: item.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[ITEM_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing item ID", { status: 400 });
    }

    // Get the item before deletion for audit logging
    const item = await db.item.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });

    if (!item) {
      return new NextResponse("Item not found", { status: 404 });
    }

    // Delete item
    await db.item.delete({
      where: { id },
    });

    // Log the deletion
    await db.auditLog.create({
      data: {
        action: "DELETE",
        userId: session.user.id,
        details: {
          type: "ITEM_DELETED",
          itemId: id,
          itemName: item.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[ITEM_DELETE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 