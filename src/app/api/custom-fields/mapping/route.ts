import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all custom fields from all categories
    const customFields = await db.customField.findMany({
      select: {
        id: true,
        name: true,
        categoryId: true,
        category: {
          select: {
            name: true
          }
        }
      }
    });

    // Create a mapping of field ID to field name
    const mapping: Record<string, { name: string, categoryName: string }> = {};
    
    customFields.forEach(field => {
      mapping[field.id] = {
        name: field.name,
        categoryName: field.category.name
      };
    });

    // Also add mappings for legacy cf_XX format fields if they exist
    // This is for backward compatibility
    const legacyMappings: Record<string, string> = {
      cf_01: "Color",
      cf_02: "Size",
      cf_03: "Material",
      cf_04: "Unit Type",
      cf_05: "Warranty Period",
      cf_06: "Power Type",
      cf_07: "Voltage",
      cf_08: "Tool Size"
    };

    Object.entries(legacyMappings).forEach(([key, value]) => {
      if (!mapping[key]) {
        mapping[key] = {
          name: value,
          categoryName: "Legacy"
        };
      }
    });

    return NextResponse.json(mapping);
  } catch (error) {
    console.error("[CUSTOM_FIELDS_MAPPING_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 