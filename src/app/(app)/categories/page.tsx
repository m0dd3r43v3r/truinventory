"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Plus, PencilIcon, Trash2Icon, InfoIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { CustomFieldsManager } from "@/components/CustomFieldsManager";
import { PermissionGate } from "@/components/PermissionGate";
import { Permission } from "@/lib/permissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Category {
  id: string;
  name: string;
  description: string | null;
  customFields: CustomField[];
  createdAt: string;
  _count?: {
    items: number;
  };
}

interface CustomField {
  id?: string;
  name: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  required: boolean;
  options: string[];
}

interface CategoryFormData {
  name: string;
  description: string;
  customFields: CustomField[];
}

function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  category,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: Category;
}) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    customFields: [],
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        customFields: category.customFields,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        customFields: [],
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({
      name: "",
      description: "",
      customFields: [],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {category ? "Edit Category" : "Add New Category"}
            </DialogTitle>
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
            <CustomFieldsManager
              fields={formData.customFields}
              onChange={(fields) => setFormData({ ...formData, customFields: fields })}
            />
          </div>
          <DialogFooter>
            <Button type="submit">
              {category ? "Save Changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | undefined>();
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      const url = categoryToEdit
        ? `/api/categories/${categoryToEdit.id}`
        : "/api/categories";
      const method = categoryToEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(categoryToEdit ? "Failed to update category" : "Failed to create category");
      }

      toast({
        title: "Success",
        description: categoryToEdit
          ? "Category updated successfully"
          : "Category created successfully",
      });

      setIsModalOpen(false);
      setCategoryToEdit(undefined);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category. Please try again.",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/categories/${id}`);
      const category = await response.json();
      
      if (category._count?.items > 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Cannot delete category. It has ${category._count.items} items assigned to it. Please reassign or delete these items first.`,
        });
        setCategoryToDelete(null);
        return;
      }

      const deleteResponse = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!deleteResponse.ok) {
        throw new Error("Failed to delete category");
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      fetchCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete category",
      });
    } finally {
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <PermissionGate 
          permission={Permission.EDIT}
          fallback={
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button disabled title="You need edit permissions to add categories">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>You need edit permissions to add categories</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        >
          <Button onClick={() => {
            setCategoryToEdit(undefined);
            setIsModalOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </PermissionGate>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Custom Fields</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description}</TableCell>
                  <TableCell>{category.customFields?.length || 0}</TableCell>
                  <TableCell>{category._count?.items || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PermissionGate 
                        permission={Permission.EDIT}
                        fallback={
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled title="You need edit permissions to modify categories">
                                  <PencilIcon className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>You need edit permissions to modify categories</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        }
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCategoryToEdit(category);
                            setIsModalOpen(true);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </PermissionGate>

                      <PermissionGate 
                        permission={Permission.EDIT}
                        fallback={
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" disabled className="text-destructive" title="You need edit permissions to delete categories">
                                  <Trash2Icon className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>You need edit permissions to delete categories</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        }
                      >
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                            >
                              <Trash2Icon className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the category. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(category.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </PermissionGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoryToEdit(undefined);
        }}
        onSubmit={handleSubmit}
        category={categoryToEdit}
      />
    </div>
  );
} 