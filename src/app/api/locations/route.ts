import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

interface LocationWithChildren {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  level: number;
  fullPath: string;
  itemCount: number;
  directItemCount: number; // Store the direct item count
  children: LocationWithChildren[];
}

export async function GET() {
  try {
    // Get all locations with item counts
    const allLocations = await db.location.findMany({
      orderBy: [
        { level: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    // Build the tree structure
    const locationMap = new Map<string, LocationWithChildren>();
    const rootLocations: LocationWithChildren[] = [];

    // First, create a map of all locations
    allLocations.forEach(location => {
      locationMap.set(location.id, {
        ...location,
        itemCount: location._count.items, // Initially set to direct count
        directItemCount: location._count.items, // Store direct count separately
        children: []
      });
    });

    // Then, build the tree structure
    allLocations.forEach(location => {
      const locationWithChildren = locationMap.get(location.id);
      if (location.parentId) {
        const parent = locationMap.get(location.parentId);
        if (parent) {
          parent.children.push(locationWithChildren!);
        }
      } else {
        rootLocations.push(locationWithChildren!);
      }
    });

    // Calculate cumulative item counts (including items from child locations)
    function calculateTotalItems(location: LocationWithChildren): number {
      let totalItems = location.directItemCount;
      
      for (const child of location.children) {
        totalItems += calculateTotalItems(child);
      }
      
      // Update the location's itemCount with the total
      location.itemCount = totalItems;
      
      return totalItems;
    }

    // Calculate totals for each root location
    rootLocations.forEach(location => {
      calculateTotalItems(location);
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

    let locationData: Prisma.LocationCreateInput;

    if (parentId) {
      const parent = await db.location.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        return new NextResponse("Parent location not found", { status: 404 });
      }

      locationData = {
        name,
        description: description || null,
        parent: {
          connect: { id: parentId }
        },
        path: `${parent.path}${parent.id}/`,
        level: parent.level + 1,
        fullPath: `${parent.fullPath}/${name}`,
      };
    } else {
      locationData = {
        name,
        description: description || null,
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