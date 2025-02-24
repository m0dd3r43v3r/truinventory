"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CustomFieldValues } from "@/components/CustomFieldValues";
import { LocationSelector } from "@/components/LocationSelector";
import { LocationCreationDialog } from "@/components/LocationCreationDialog";
import { Plus } from "lucide-react";

interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  required: boolean;
  options: string[];
}

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddItemFormData) => Promise<void>;
  categories: { 
    id: string; 
    name: string;
    customFields: CustomField[];
  }[];
  locations: { id: string; name: string }[];
  onCategoryCreate: (data: NewCategoryLocationForm) => Promise<void>;
  onLocationCreate: (data: { name: string; description: string; parentId?: string }) => Promise<string | undefined>;
}

interface AddItemFormData {
  name: string;
  description: string;
  quantity: number;
  categoryId: string;
  locationId: string;
  customFields?: Record<string, any>;
}

interface NewCategoryLocationForm {
  name: string;
  description: string;
}

export function AddItemModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  locations,
  onCategoryCreate,
  onLocationCreate,
}: AddItemModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AddItemFormData>({
    name: "",
    description: "",
    quantity: 0,
    categoryId: "",
    locationId: "",
    customFields: {},
  });

  const [categoryFields, setCategoryFields] = useState<CustomField[]>([]);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);

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
        description: "Item created successfully",
      });
      handleClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create item. Please try again.",
      });
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      quantity: 0,
      categoryId: "",
      locationId: "",
      customFields: {},
    });
    onClose();
  };

  const handleLocationCreated = async (data: { name: string; description: string; parentId?: string }) => {
    try {
      const locationId = await onLocationCreate(data);
      if (locationId) {
        setFormData(prev => ({ ...prev, locationId }));
      }
      setIsLocationDialogOpen(false);
    } catch (error) {
      console.error("Failed to create location:", error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4">
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
                    setFormData({ 
                      ...formData, 
                      categoryId: e.target.value,
                      customFields: {} 
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="location">Location</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLocationDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Location
                  </Button>
                </div>
                <LocationSelector
                  value={formData.locationId}
                  onChange={(locationId) => setFormData({ ...formData, locationId })}
                  className="max-h-[200px] overflow-y-auto border rounded-md"
                  required
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
              <Button type="submit">Add Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <LocationCreationDialog
        isOpen={isLocationDialogOpen}
        onClose={() => setIsLocationDialogOpen(false)}
        onSubmit={handleLocationCreated}
      />
    </>
  );
}
