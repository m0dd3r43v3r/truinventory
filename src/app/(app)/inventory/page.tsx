"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, PlusCircle, PencilIcon, Trash2Icon, QrCodeIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { QRCodeDialog } from "@/components/QRCodeDialog";
import { EditItemModal } from "@/components/EditItemModal";
import { CustomFieldValues } from "@/components/CustomFieldValues";
import { LocationSelector } from "@/components/LocationSelector";
import { LocationCreationDialog } from "@/components/LocationCreationDialog";
import { PermissionGate } from "@/components/PermissionGate";
import { Permission } from "@/lib/permissions";

interface CustomField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  required: boolean;
  options: string[];
}

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  category: {
    id: string;
    name: string;
    customFields: CustomField[];
  };
  location: {
    id: string;
    name: string;
    parent: {
      name: string;
    } | null;
  };
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, any>;
}

interface AddItemFormData {
  name: string;
  description: string;
  quantity: number;
  categoryId: string;
  locationId: string;
  customFields?: Record<string, any>;
}

interface EditItemFormData {
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

interface Location {
  id: string;
  name: string;
  children: Location[];
  level: number;
  fullPath: string;
}

function AddItemModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  locations,
  onCategoryCreate,
  onLocationCreate,
}: {
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
  onLocationCreate: (data: { name: string; description: string; parentId?: string }) => Promise<void>;
}) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AddItemFormData>({
    name: "",
    description: "",
    quantity: 0,
    categoryId: "",
    locationId: "",
    customFields: {},
  });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [locationRefreshTrigger, setLocationRefreshTrigger] = useState(0);
  const [newCategory, setNewCategory] = useState<NewCategoryLocationForm>({
    name: "",
    description: "",
  });
  const [categoryFields, setCategoryFields] = useState<CustomField[]>([]);

  // Update custom fields when category changes
  useEffect(() => {
    const category = categories.find(c => c.id === formData.categoryId);
    setCategoryFields(category?.customFields || []);
  }, [formData.categoryId, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      name: "",
      description: "",
      quantity: 0,
      categoryId: "",
      locationId: "",
      customFields: {},
    });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCategoryCreate(newCategory);
    setIsAddingCategory(false);
    setNewCategory({ name: "", description: "" });
  };

  const handleLocationCreated = async (data: { name: string; description: string; parentId?: string }) => {
    try {
      await onLocationCreate(data);
      setIsLocationDialogOpen(false);
      // Increment the refresh trigger to force a refresh of the LocationSelector
      setLocationRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to create location:", error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle asChild>
                <h2>Add New Item</h2>
              </DialogTitle>
              <DialogDescription asChild>
                <p>Fill in the details for the new inventory item.</p>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label asChild>
                  <span>Name</span>
                </Label>
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
                <Label asChild>
                  <span>Description</span>
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label asChild>
                  <span>Quantity</span>
                </Label>
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
                <div className="flex items-center justify-between">
                  <Label asChild>
                    <span>Category</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    New Category
                  </Button>
                </div>
                {isAddingCategory ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Category description (optional)"
                      value={newCategory.description}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                      }
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={!newCategory.name}
                      >
                        Add Category
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddingCategory(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.categoryId}
                    onChange={(e) => {
                      const newCategoryId = e.target.value;
                      setFormData({ 
                        ...formData, 
                        categoryId: newCategoryId,
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
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label asChild>
                    <span>Location</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setIsLocationDialogOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    New Location
                  </Button>
                </div>
                <LocationSelector
                  value={formData.locationId}
                  onChange={(locationId) => setFormData({ ...formData, locationId })}
                  refreshTrigger={locationRefreshTrigger}
                />
              </div>

              {categoryFields.length > 0 && (
                <div className="grid gap-2">
                  <Label asChild>
                    <span>Custom Fields</span>
                  </Label>
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

const LocationMenuItem = ({ location, currentFilter, onSelect }: { 
  location: Location; 
  currentFilter: string;
  onSelect: (id: string) => void;
}) => {
  return (
    <>
      <DropdownMenuItem asChild>
        <div
          key={location.id}
          onClick={() => onSelect(location.id)}
          className={currentFilter === location.id ? "bg-accent" : ""}
          style={{ marginLeft: `${location.level * 1}rem` }}
        >
          {location.name}
        </div>
      </DropdownMenuItem>
      {location.children?.map((child) => (
        <LocationMenuItem
          key={child.id}
          location={child}
          currentFilter={currentFilter}
          onSelect={onSelect}
        />
      ))}
    </>
  );
};

export default function InventoryPage() {
  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [categories, setCategories] = useState<{ id: string; name: string; customFields: CustomField[] }[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchLocations();
  }, []);

  async function fetchItems() {
    try {
      setIsLoading(true);
      const searchParams = new URLSearchParams();
      if (search) searchParams.append("search", search);
      if (categoryFilter) searchParams.append("categoryId", categoryFilter);
      if (locationFilter) searchParams.append("locationId", locationFilter);

      const response = await fetch(`/api/items?${searchParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch items");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch items",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      // Transform the data to include customFields
      const transformedCategories = data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        customFields: cat.customFields || []
      }));
      setCategories(transformedCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories",
      });
    }
  }

  async function fetchLocations() {
    try {
      const response = await fetch("/api/locations");
      if (!response.ok) throw new Error("Failed to fetch locations");
      const data = await response.json();
      // Transform the data to match Location interface
      const transformedLocations = data.map((loc: any) => ({
        id: loc.id,
        name: loc.name,
        children: loc.children || [],
        level: loc.level || 0,
        fullPath: loc.fullPath || loc.name
      }));
      setLocations(transformedLocations);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch locations",
      });
    }
  }

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, locationFilter]);

  const handleAddItem = async (data: AddItemFormData) => {
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      const newItem = await response.json();
      setItems((prevItems) => [newItem, ...prevItems]);
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Item added successfully",
      });
    } catch (error) {
      console.error("Failed to add item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add item. Please try again.",
      });
    }
  };

  const handleAddCategory = async (data: NewCategoryLocationForm) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      const newCategory = await response.json();
      setCategories((prev) => [...prev, newCategory]);
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    } catch (error) {
      console.error("Failed to create category:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create category. Please try again.",
      });
    }
  };

  const handleLocationCreate = async (data: { name: string; description: string; parentId?: string }) => {
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const location = await response.json();
      toast({
        title: "Success",
        description: "Location created successfully",
      });

      // Refresh locations
      await fetchLocations();

      return location.id;
    } catch (error) {
      console.error("Failed to create location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create location",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/items?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      toast({
        title: "Success",
        description: "Item deleted successfully",
      });

      // Refresh items
      fetchItems();
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item",
      });
    } finally {
      setItemToDelete(null);
    }
  };

  const handleEdit = async (data: EditItemFormData) => {
    try {
      if (!itemToEdit?.id) {
        throw new Error("No item selected for editing");
      }

      const response = await fetch(`/api/items/${itemToEdit.id}`, {
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
        throw new Error(errorData || "Failed to update item");
      }

      const updatedItem = await response.json();

      // Refresh items
      await fetchItems();
      setItemToEdit(null);
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

  const handleRowClick = (itemId: string) => {
    router.push(`/inventory/${itemId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <div className="flex gap-2">
          <PermissionGate permission={Permission.EDIT}>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </PermissionGate>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm hover:bg-accent whitespace-nowrap">
                <Filter className="h-4 w-4" />
                Category
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <div
                  onClick={() => setCategoryFilter("")}
                  className={!categoryFilter ? "bg-accent" : ""}
                >
                  All Categories
                </div>
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem asChild key={category.id}>
                  <div
                    onClick={() => setCategoryFilter(category.id)}
                    className={categoryFilter === category.id ? "bg-accent" : ""}
                  >
                    {category.name}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm hover:bg-accent whitespace-nowrap">
                <Filter className="h-4 w-4" />
                Location
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto">
              <DropdownMenuItem asChild>
                <div
                  onClick={() => setLocationFilter("")}
                  className={!locationFilter ? "bg-accent" : ""}
                >
                  All Locations
                </div>
              </DropdownMenuItem>
              {locations.map((location) => (
                <LocationMenuItem
                  key={location.id}
                  location={location}
                  currentFilter={locationFilter}
                  onSelect={setLocationFilter}
                />
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="hidden sm:table-cell">Location</TableHead>
              <TableHead className="hidden lg:table-cell">Last Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No items found.
                </TableCell>
              </TableRow>
            ) : items.map((item) => (
              <TableRow 
                key={item.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(item.id)}
              >
                <TableCell>
                  <div>
                    <div>{item.name}</div>
                    <div className="text-sm text-muted-foreground sm:hidden">
                      {item.category.name} • {item.location.name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{item.description}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {item.category.name}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {item.location.parent ? `${item.location.parent.name} / ${item.location.name}` : item.location.name}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {format(new Date(item.updatedAt), "PPp")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <PermissionGate permission={Permission.EDIT}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToEdit(item);
                        }}
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item.id);
                            }}
                          >
                            <Trash2Icon className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle asChild>
                              <h2>Are you sure?</h2>
                            </AlertDialogTitle>
                            <AlertDialogDescription asChild>
                              <p>
                                This action cannot be undone. This will permanently delete the item
                                and remove it from our servers.
                              </p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                variant="destructive"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleDelete(item.id);
                                }}
                              >
                                Delete
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </PermissionGate>

                    <QRCodeDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <QrCodeIcon className="h-4 w-4" />
                          <span className="sr-only">View QR Code</span>
                        </Button>
                      }
                      value={JSON.stringify({
                        id: item.id,
                        name: item.name,
                        quantity: item.quantity,
                        category: item.category.name,
                        location: item.location.name,
                      })}
                      title={`QR Code for ${item.name}`}
                      itemName={item.name}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddItem}
        categories={categories as { id: string; name: string; customFields: CustomField[]; }[]}
        locations={locations}
        onCategoryCreate={handleAddCategory}
        onLocationCreate={handleLocationCreate}
      />

      {itemToEdit && (
        <EditItemModal
          isOpen={!!itemToEdit}
          onClose={() => setItemToEdit(null)}
          onSubmit={handleEdit}
          item={{
            id: itemToEdit.id,
            name: itemToEdit.name,
            description: itemToEdit.description || "",
            quantity: itemToEdit.quantity,
            categoryId: itemToEdit.category.id,
            locationId: itemToEdit.location.id,
            customFields: itemToEdit.customFields || {},
          }}
          categories={categories}
          locations={locations}
        />
      )}
    </div>
  );
} 