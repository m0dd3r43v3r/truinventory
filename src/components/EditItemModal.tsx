import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CustomFieldValues } from "@/components/CustomFieldValues";
import { LocationSelector } from "@/components/LocationSelector";

interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  required: boolean;
  options: string[];
}

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditItemFormData) => Promise<void>;
  item: {
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    categoryId: string;
    locationId: string;
    customFields?: Record<string, any>;
  };
  categories: { 
    id: string; 
    name: string;
    customFields: CustomField[];
  }[];
  locations: { id: string; name: string }[];
}

interface EditItemFormData {
  name: string;
  description: string;
  quantity: number;
  categoryId: string;
  locationId: string;
  customFields?: Record<string, any>;
}

export function EditItemModal({
  isOpen,
  onClose,
  onSubmit,
  item,
  categories,
  locations,
}: EditItemModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<EditItemFormData>({
    name: "",
    description: "",
    quantity: 0,
    categoryId: "",
    locationId: "",
    customFields: {},
  });
  const [originalData, setOriginalData] = useState<EditItemFormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [categoryFields, setCategoryFields] = useState<CustomField[]>([]);

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      const initialData = {
        name: item.name,
        description: item.description || "",
        quantity: item.quantity,
        categoryId: item.categoryId,
        locationId: item.locationId,
        customFields: item.customFields || {},
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);
    }
  }, [item]);

  // Check for changes whenever form data changes
  useEffect(() => {
    if (!originalData) return;
    
    // Compare current form data with original data
    const isChanged = 
      formData.name !== originalData.name ||
      formData.description !== originalData.description ||
      formData.quantity !== originalData.quantity ||
      formData.categoryId !== originalData.categoryId ||
      formData.locationId !== originalData.locationId ||
      JSON.stringify(formData.customFields) !== JSON.stringify(originalData.customFields);
    
    setHasChanges(isChanged);
  }, [formData, originalData]);

  // Update custom fields when category changes
  useEffect(() => {
    const category = categories.find(c => c.id === formData.categoryId);
    setCategoryFields(category?.customFields || []);
  }, [formData.categoryId, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required custom fields
    const category = categories.find(c => c.id === formData.categoryId);
    if (category) {
      const missingRequiredFields = category.customFields
        .filter(field => field.required)
        .filter(field => !formData.customFields || !formData.customFields[field.id]);

      if (missingRequiredFields.length > 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Missing required custom fields: ${missingRequiredFields.map(f => f.name).join(", ")}`,
        });
        return;
      }
    }

    try {
      await onSubmit(formData);
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update item. Please try again.";
      
      // Handle the specific error for no changes detected
      if (errorMessage.includes("No changes detected")) {
        toast({
          variant: "default",
          title: "No Changes",
          description: "No changes were detected. The item was not updated.",
        });
        onClose();
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            {hasChanges && (
              <p className="text-sm text-muted-foreground mt-1">
                You have unsaved changes
              </p>
            )}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={formData.categoryId}
                onChange={(e) => {
                  const newCategoryId = e.target.value;
                  const newCategory = categories.find(c => c.id === newCategoryId);
                  const existingCustomFields = formData.customFields || {};
                  
                  // Only keep custom fields that exist in the new category
                  const validCustomFields = newCategory?.customFields.reduce((acc, field) => {
                    if (existingCustomFields[field.id] !== undefined) {
                      acc[field.id] = existingCustomFields[field.id];
                    }
                    return acc;
                  }, {} as Record<string, any>) || {};

                  setFormData({ 
                    ...formData, 
                    categoryId: newCategoryId,
                    customFields: validCustomFields
                  });
                }}
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <LocationSelector
                value={formData.locationId}
                onChange={(locationId) => setFormData({ ...formData, locationId })}
              />
            </div>

            {categoryFields.length > 0 && (
              <div className="grid gap-2">
                <Label>Custom Fields</Label>
                <CustomFieldValues
                  fields={categoryFields}
                  values={formData.customFields || {}}
                  onChange={(values) =>
                    setFormData({ ...formData, customFields: values })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!hasChanges}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 