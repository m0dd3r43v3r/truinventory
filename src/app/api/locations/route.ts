import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET() {
  try {
    // Get all locations
    const allLocations = await db.location.findMany({
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ]
    });

    // Build the tree structure
    const locationMap = new Map();
    const rootLocations = [];

    // First, create a map of all locations
    allLocations.forEach(location => {
      locationMap.set(location.id, {
        ...location,
        children: []
      });
    });

    // Then, build the tree structure
    allLocations.forEach(location => {
      const locationWithChildren = locationMap.get(location.id);
      if (location.parentId) {
        const parent = locationMap.get(location.parentId);
        if (parent) {
          parent.children.push(locationWithChildren);
        }
      } else {
        rootLocations.push(locationWithChildren);
      }
    });

    return NextResponse.json(rootLocations);
  } catch (error) {
    console.error("[LOCATIONS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { name, description, parentId } = await req.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    let locationData: Prisma.LocationCreateInput = {
      name,
      description: description || null,
    };

    if (parentId) {
      const parent = await db.location.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return new NextResponse("Parent location not found", { status: 404 });
      }

      locationData = {
        ...locationData,
        parent: {
          connect: { id: parentId }
        },
        path: `${parent.path}${parent.id}/`,
        level: parent.level + 1,
        fullPath: `${parent.fullPath}/${name}`,
      };
    } else {
      locationData = {
        ...locationData,
        path: "/",
        level: 0,
        fullPath: `/${name}`,
      };
    }

    const location = await db.location.create({
      data: locationData,
    });

    await db.auditLog.create({
      data: {
        action: "CREATE",
        userId: session.user.id,
        details: {
          type: "LOCATION_CREATED",
          locationId: location.id,
          locationName: location.name,
          parentId: parentId || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new NextResponse("A location with this path already exists", { status: 400 });
      }
    }
    console.error("[LOCATION_CREATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 