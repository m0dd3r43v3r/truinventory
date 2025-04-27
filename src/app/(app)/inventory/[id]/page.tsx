"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeftIcon, 
  QrCodeIcon, 
  PackageIcon, 
  CalendarIcon, 
  MapPinIcon,
  FolderIcon,
  InfoIcon,
  HashIcon,
  ClipboardIcon,
  HistoryIcon,
  PencilIcon
} from "lucide-react";
import { format } from "date-fns";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { EditItemModal } from "@/components/EditItemModal";

interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  required: boolean;
  options: string[];
}

interface ItemDetails {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  category: {
    id: string;
    name: string;
    customFields: CustomField[];
  } | null;
  location: {
    id: string;
    name: string;
  } | null;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  details: {
    type: string;
    changes?: Record<string, { from: any; to: any }>;
    timestamp: string;
  };
}

interface EditItemFormData {
  name: string;
  description: string;
  quantity: number;
  categoryId: string;
  locationId: string;
  customFields?: Record<string, any>;
}

export default function ItemDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; customFields: CustomField[]; }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string; }[]>([]);
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [itemId, setItemId] = useState<string | null>(null);

  // Handle the async params
  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      setItemId(resolvedParams.id);
    }
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!itemId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const [itemResponse, logsResponse, categoriesResponse, locationsResponse] = await Promise.all([
          fetch(`/api/items/${itemId}?t=${timestamp}`),
          fetch(`/api/audit-logs?itemId=${itemId}&t=${timestamp}`),
          fetch(`/api/categories?t=${timestamp}`),
          fetch(`/api/locations?t=${timestamp}`)
        ]);

        if (!itemResponse.ok) {
          throw new Error("Failed to fetch item details");
        }

        const [itemData, logsData, categoriesData, locationsData] = await Promise.all([
          itemResponse.json(),
          logsResponse.json(),
          categoriesResponse.json(),
          locationsResponse.json()
        ]);

        setItem(itemData);
        setAuditLogs(logsData);
        setCategories(categoriesData);
        setLocations(locationsData);
      } catch (error) {
        console.error("[FETCH_DATA_ERROR]", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId, toast]);

  const handleEdit = async (data: EditItemFormData) => {
    try {
      if (!item?.id) {
        throw new Error("No item selected for editing");
      }

      const response = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          quantity: data.quantity,
          categoryId: data.categoryId,
          locationId: data.locationId,
          customFields: data.customFields || {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        
        // If no changes were detected, close the modal but don't show an error
        if (errorData.includes("No changes detected")) {
          setShowEditModal(false);
          toast({
            variant: "default",
            title: "No Changes",
            description: "No changes were detected. The item was not updated.",
          });
          return;
        }
        
        throw new Error(errorData || "Failed to update item");
      }

      // Refresh item data and audit logs with cache busting
      const timestamp = new Date().getTime();
      const [updatedItemResponse, updatedLogsResponse] = await Promise.all([
        fetch(`/api/items/${item.id}?t=${timestamp}`),
        fetch(`/api/audit-logs?itemId=${item.id}&t=${timestamp}`)
      ]);
      
      const [updatedItem, updatedLogs] = await Promise.all([
        updatedItemResponse.json(),
        updatedLogsResponse.json()
      ]);
      
      setItem(updatedItem);
      setAuditLogs(updatedLogs);
      
      setShowEditModal(false);
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error) {
      console.error("Failed to update item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
      });
    }
  };

  // Function to refresh audit logs
  const refreshAuditLogs = async () => {
    if (!itemId) return;
    
    try {
      setRefreshingLogs(true);
      const timestamp = new Date().getTime();
      const logsResponse = await fetch(`/api/audit-logs?itemId=${itemId}&t=${timestamp}`);
      const logsData = await logsResponse.json();
      setAuditLogs(logsData);
      toast({
        title: "Refreshed",
        description: "Changelog has been refreshed",
      });
    } catch (error) {
      console.error("Failed to refresh audit logs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh changelog",
      });
    } finally {
      setRefreshingLogs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-muted-foreground">Item not found</div>
      </div>
    );
  }

  const qrCodeValue = JSON.stringify({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    category: item.category?.name,
    location: item.location?.name,
  });

  // Helper function to format custom field values
  const formatCustomFieldValue = (field: CustomField, value: any) => {
    if (value === undefined || value === null || value === "") {
      return "Not set";
    }

    switch (field.type) {
      case "boolean":
        return value ? "Yes" : "No";
      case "date":
        return value ? format(new Date(value), "PPP") : "Not set";
      case "select":
        return field.options.includes(value) ? value : "Invalid option";
      case "number":
        return typeof value === "number" ? value.toString() : value;
      default:
        return value.toString();
    }
  };

  // Helper function to parse and extract custom field value
  const parseCustomFieldValue = (value: any) => {
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        // Check if it's a custom field value object (has an ID and value)
        if (parsed && typeof parsed === "object") {
          // Return just the value part if it exists
          const entries = Object.entries(parsed);
          if (entries.length === 1) {
            return entries[0][1];
          }
        }
        return parsed;
      } catch {
        return value;
      }
    }
    return value;
  };

  // Helper function to format change value
  const formatChangeValue = (field: string, value: any) => {
    if (value === null || value === undefined) return "Not set";
    
    // Special handling for custom fields
    if (field === "customFields") {
      // If it's an empty object, return "Not set"
      if (!value || Object.keys(value).length === 0) {
        return "Not set";
      }
      
      // For custom fields, we need to show the field names and values
      try {
        // Get the category custom fields to map IDs to names
        const categoryFields = item?.category?.customFields || [];
        const fieldMap = Object.fromEntries(
          categoryFields.map(field => [field.id, field.name])
        );
        
        // Format each custom field
        const formattedFields = Object.entries(value).map(([fieldId, fieldValue]) => {
          const fieldName = fieldMap[fieldId] || fieldId;
          return `${fieldName}: ${fieldValue}`;
        });
        
        return formattedFields.join(", ");
      } catch (e) {
        console.error("Error formatting custom fields:", e);
        return JSON.stringify(value);
      }
    }
    
    // For other fields, use the standard formatting
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  // Helper function to get field label
  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      name: "Name",
      description: "Description",
      quantity: "Quantity",
      categoryId: "Category",
      locationId: "Location",
      customFields: "Custom Fields"
    };
    return labels[field] || field;
  };

  // Custom component to display custom field changes
  function CustomFieldChanges({ 
    from, 
    to, 
    categoryFields 
  }: { 
    from: Record<string, any>; 
    to: Record<string, any>; 
    categoryFields: CustomField[] 
  }) {
    // Create a map of field IDs to field names
    const fieldMap = Object.fromEntries(
      categoryFields.map(field => [field.id, field.name])
    );
    
    // Get all field IDs that exist in either from or to
    const allFieldIds = [...new Set([...Object.keys(from || {}), ...Object.keys(to || {})])];
    
    if (allFieldIds.length === 0) {
      return (
        <div className="text-sm pl-4">No custom field changes</div>
      );
    }
    
    return (
      <div className="space-y-2 pl-4">
        {allFieldIds.map(fieldId => {
          const fieldName = fieldMap[fieldId] || fieldId;
          const fromValue = from?.[fieldId] ?? "Not set";
          const toValue = to?.[fieldId] ?? "Not set";
          
          // Only show fields that have changed
          if (JSON.stringify(fromValue) === JSON.stringify(toValue)) {
            return null;
          }
          
          return (
            <div key={fieldId} className="grid grid-cols-2 gap-4 text-sm border-l border-muted pl-2 py-1">
              <div className="space-y-1">
                <div className="font-medium">{fieldName}</div>
                <div className="text-muted-foreground">From: {String(fromValue)}</div>
              </div>
              <div className="space-y-1">
                <div className="font-medium">&nbsp;</div>
                <div>To: {String(toValue)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Inventory
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Item
          </Button>
          <QRCodeDialog
            trigger={
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <QrCodeIcon className="h-4 w-4" />
                View QR Code
              </Button>
            }
            value={qrCodeValue}
            title="Item QR Code"
            itemName={item.name}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <PackageIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <InfoIcon className="h-4 w-4" />
                <span>Name</span>
              </div>
              <div className="font-medium">{item.name}</div>
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ClipboardIcon className="h-4 w-4" />
                <span>Description</span>
              </div>
              <div>{item.description || "No description provided"}</div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <HashIcon className="h-4 w-4" />
                <span>Quantity</span>
              </div>
              <div className="font-medium">{item.quantity}</div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <MapPinIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Location Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FolderIcon className="h-4 w-4" />
                <span>Category</span>
              </div>
              <div className="font-medium">
                {item.category?.name || "No category assigned"}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPinIcon className="h-4 w-4" />
                <span>Location</span>
              </div>
              <div className="font-medium">
                {item.location?.name || "No location assigned"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Fields */}
        {item.category?.customFields && item.category.customFields.length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Custom Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {item.category.customFields.map((field) => (
                  <div key={field.id} className="space-y-1">
                    <div className="text-sm text-muted-foreground">{field.name}</div>
                    <div className="font-medium">
                      {formatCustomFieldValue(field, item.customFields?.[field.id])}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Timestamps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Created At</div>
                <div className="font-medium">
                  {format(new Date(item.createdAt), "PPpp")}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="font-medium">
                  {format(new Date(item.updatedAt), "PPpp")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Changelog */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Changelog</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshAuditLogs}
              disabled={refreshingLogs}
              className="h-8"
            >
              {refreshingLogs ? "Refreshing..." : "Refresh"}
            </Button>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No changes have been recorded yet
              </div>
            ) : (
              <div className="space-y-6">
                {auditLogs.map((log) => (
                  <div key={log.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.user.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {log.user.email}
                        </span>
                      </div>
                      <time className="text-sm text-muted-foreground">
                        {format(new Date(log.createdAt), "PPpp")}
                      </time>
                    </div>

                    {log.details.type === "ITEM_UPDATED" && log.details.changes && (
                      <div className="grid gap-2 pl-4 border-l-2 border-muted">
                        {Object.entries(log.details.changes).map(([field, change]) => (
                          change && (
                            <div key={field} className="grid gap-1">
                              <div className="text-sm font-medium">
                                Changed {getFieldLabel(field)}
                              </div>
                              {field === "customFields" ? (
                                <CustomFieldChanges 
                                  from={change.from} 
                                  to={change.to} 
                                  categoryFields={item.category?.customFields || []}
                                />
                              ) : (
                                <div className="grid grid-cols-2 gap-4 text-sm pl-4">
                                  <div className="text-muted-foreground">
                                    From: {formatChangeValue(field, change.from)}
                                  </div>
                                  <div>
                                    To: {formatChangeValue(field, change.to)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    )}

                    {log.details.type === "ITEM_CREATED" && (
                      <div className="pl-4 border-l-2 border-muted">
                        <div className="text-sm">Item was created</div>
                      </div>
                    )}

                    {log.details.type === "ITEM_DELETED" && (
                      <div className="pl-4 border-l-2 border-muted">
                        <div className="text-sm">Item was deleted</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {item && showEditModal && (
        <EditItemModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEdit}
          item={{
            id: item.id,
            name: item.name,
            description: item.description || "",
            quantity: item.quantity,
            categoryId: item.category?.id || "",
            locationId: item.location?.id || "",
            customFields: item.customFields || {},
          }}
          categories={categories}
          locations={locations}
        />
      )}
    </div>
  );
} 