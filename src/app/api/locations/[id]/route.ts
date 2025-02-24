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
    const { name, description, parentId } = await request.json();

    // Get existing location
    const existingLocation = await db.location.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!existingLocation) {
      return new NextResponse("Location not found", { status: 404 });
    }

    // If parent is being changed, validate the new parent
    if (parentId && parentId !== existingLocation.parentId) {
      // Check if new parent exists
      const newParent = await db.location.findUnique({
        where: { id: parentId },
      });

      if (!newParent) {
        return new NextResponse("Parent location not found", { status: 404 });
      }

      // Check if new parent is not a descendant of this location
      let currentParent = newParent;
      while (currentParent.parentId) {
        if (currentParent.parentId === id) {
          return new NextResponse("Cannot move a location to its own descendant", { status: 400 });
        }
        currentParent = await db.location.findUnique({
          where: { id: currentParent.parentId },
        }) as any;
      }

      // Calculate new path and level
      const parentPath = newParent.path;
      const level = newParent.level + 1;
      const fullPath = `${newParent.fullPath}/${name}`;

      // Check if new fullPath already exists
      const existingWithPath = await db.location.findUnique({
        where: { fullPath },
      });

      if (existingWithPath && existingWithPath.id !== id) {
        return new NextResponse("A location with this path already exists", { status: 400 });
      }

      // Update location with new parent
      const updatedLocation = await db.location.update({
        where: { id },
        data: {
          name,
          description,
          parentId,
          path: `${parentPath}${parentId}/`,
          fullPath,
          level,
        },
      });

      // Update all children's paths and levels recursively
      await updateChildrenPaths(updatedLocation);

      // Log the update
      await db.auditLog.create({
        data: {
          action: "UPDATE",
          userId: session.user.id,
          details: {
            type: "LOCATION_UPDATED",
            locationId: id,
            locationName: name,
            changes: {
              name: name !== existingLocation.name ? { from: existingLocation.name, to: name } : undefined,
              description: description !== existingLocation.description ? { from: existingLocation.description, to: description } : undefined,
              parentId: parentId !== existingLocation.parentId ? { from: existingLocation.parentId, to: parentId } : undefined,
            },
            timestamp: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json(updatedLocation);
    } else {
      // Just updating name/description
      const fullPath = existingLocation.parentId
        ? `${existingLocation.path.split("/").slice(0, -2).join("/")}/${name}`
        : `/${name}`;

      // Check if new fullPath already exists
      const existingWithPath = await db.location.findUnique({
        where: { fullPath },
      });

      if (existingWithPath && existingWithPath.id !== id) {
        return new NextResponse("A location with this path already exists", { status: 400 });
      }

      const updatedLocation = await db.location.update({
        where: { id },
        data: {
          name,
          description,
          fullPath,
        },
      });

      // Update all children's fullPaths
      await updateChildrenPaths(updatedLocation);

      // Log the update
      await db.auditLog.create({
        data: {
          action: "UPDATE",
          userId: session.user.id,
          details: {
            type: "LOCATION_UPDATED",
            locationId: id,
            locationName: name,
            changes: {
              name: name !== existingLocation.name ? { from: existingLocation.name, to: name } : undefined,
              description: description !== existingLocation.description ? { from: existingLocation.description, to: description } : undefined,
            },
            timestamp: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json(updatedLocation);
    }
  } catch (error) {
    console.error("[LOCATION_UPDATE_ERROR]", error instanceof Error ? error.message : "Unknown error");
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

    // Check if location exists and get its details
    const location = await db.location.findUnique({
      where: { id },
      include: {
        items: true,
        children: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!location) {
      return new NextResponse("Location not found", { status: 404 });
    }

    // Check if location or any of its children have items
    const hasItems = location.items.length > 0 || location.children.some(child => child.items.length > 0);
    if (hasItems) {
      return new NextResponse(
        "Cannot delete location with items. Please reassign all items first.",
        { status: 400 }
      );
    }

    // Delete location and all its children (will cascade due to schema)
    await db.location.delete({
      where: { id },
    });

    // Log the deletion
    await db.auditLog.create({
      data: {
        action: "DELETE",
        userId: session.user.id,
        details: {
          type: "LOCATION_DELETED",
          locationId: id,
          locationName: location.name,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LOCATION_DELETE_ERROR]", error instanceof Error ? error.message : "Unknown error");
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Helper function to update children's paths recursively
async function updateChildrenPaths(parent: any) {
  const children = await db.location.findMany({
    where: { parentId: parent.id },
  });

  for (const child of children) {
    const fullPath = `${parent.fullPath}/${child.name}`;
    const path = `${parent.path}${parent.id}/`;
    const level = parent.level + 1;

    await db.location.update({
      where: { id: child.id },
      data: {
        path,
        fullPath,
        level,
      },
    });

    // Recursively update children
    await updateChildrenPaths({
      ...child,
      path,
      fullPath,
      level,
    });
  }
} 