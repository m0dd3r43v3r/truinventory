import { db } from "@/lib/db";

export async function loadAzureConfig() {
  try {
    const settings = await db.settings.findFirst();
    if (settings?.azureClientId && settings?.azureTenantId && settings?.azureClientSecret) {
      process.env.AZURE_AD_CLIENT_ID = settings.azureClientId;
      process.env.AZURE_AD_CLIENT_SECRET = settings.azureClientSecret;
      process.env.AZURE_AD_TENANT_ID = settings.azureTenantId;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to load Azure AD config:", error);
    return false;
  }
} 