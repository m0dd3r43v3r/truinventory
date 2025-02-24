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

    // Get total counts
    const [
      totalItems,
      totalCategories,
      totalLocations,
      lowStockItems,
      emptyLocations,
      parentLocations,
      childLocations
    ] = await Promise.all([
      db.item.count(),
      db.category.count(),
      db.location.count(),
      db.item.count({
        where: {
          quantity: {
            lte: 5 // Consider items with 5 or fewer units as low stock
          }
        }
      }),
      db.location.count({
        where: {
          items: {
            none: {}
          }
        }
      }),
      db.location.count({
        where: {
          parentId: null
        }
      }),
      db.location.count({
        where: {
          NOT: {
            parentId: null
          }
        }
      })
    ]);

    // Get top categories
    const topCategories = await db.category.findMany({
      take: 5,
      include: {
        _count: {
          select: {
            items: true
          }
        }
      },
      orderBy: {
        items: {
          _count: 'desc'
        }
      }
    });

    // Get top locations (only child locations)
    const topLocations = await db.location.findMany({
      where: {
        NOT: {
          parentId: null
        }
      },
      take: 5,
      include: {
        _count: {
          select: {
            items: true
          }
        },
        parent: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        items: {
          _count: 'desc'
        }
      }
    });

    return NextResponse.json({
      totalItems,
      totalCategories,
      totalLocations,
      lowStockItems,
      emptyLocations,
      parentLocations,
      childLocations,
      topCategories: topCategories.map(category => ({
        name: category.name,
        itemCount: category._count.items
      })),
      topLocations: topLocations.map(location => ({
        name: `${location.parent.name} / ${location.name}`,
        itemCount: location._count.items
      }))
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 