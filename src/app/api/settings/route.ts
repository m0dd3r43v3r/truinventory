import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const settings = await db.settings.findFirst();

    // For unauthenticated requests, only return Azure AD status
    if (!session) {
      return NextResponse.json({
        azureClientId: settings?.azureClientId || "",
        azureTenantId: settings?.azureTenantId || "",
        hasAzureClientSecret: !!settings?.azureClientSecret,
      });
    }

    // For admin users, return all settings
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    
    return NextResponse.json({
      azureClientId: settings?.azureClientId || "",
      azureTenantId: settings?.azureTenantId || "",
      hasAzureClientSecret: !!settings?.azureClientSecret,
    });
  } catch (error) {
    console.error("[SETTINGS_GET_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { azureClientId, azureTenantId, azureClientSecret } = await req.json();

    const settings = await db.settings.findFirst();

    if (settings) {
      // Update existing settings
      await db.settings.update({
        where: { id: settings.id },
        data: {
          azureClientId,
          azureTenantId,
          azureClientSecret,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new settings
      await db.settings.create({
        data: {
          azureClientId,
          azureTenantId,
          azureClientSecret,
        },
      });
    }

    // Log the update
    await db.auditLog.create({
      data: {
        action: "UPDATE",
        userId: session.user.id,
        details: {
          type: "SETTINGS_UPDATED",
          updatedFields: ["azureClientId", "azureTenantId", "azureClientSecret"].filter(
            field => eval(field) !== undefined
          ),
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SETTINGS_UPDATE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 