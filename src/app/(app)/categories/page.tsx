"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Plus, PencilIcon, Trash2Icon } from "lucide-react";
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
        description: "Failed to save category. Please try again.",
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
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Description</TableHead>
              <TableHead className="hidden sm:table-cell">Custom Fields</TableHead>
              <TableHead className="hidden sm:table-cell">Items</TableHead>
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
                  <TableCell>
                    <div>
                      <div>{category.name}</div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {category.customFields.length} fields • {category._count?.items || 0} items
                      </div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground md:hidden">
                          {category.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{category.description}</TableCell>
                  <TableCell className="hidden sm:table-cell">{category.customFields.length} fields</TableCell>
                  <TableCell className="hidden sm:table-cell">{category._count?.items || 0} items</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
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

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            disabled={!!category._count?.items}
                            title={category._count?.items ? "Cannot delete category with items" : "Delete category"}
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
                              <p>This action cannot be undone. This will permanently delete the category.</p>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button variant="outline">Cancel</Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                variant="destructive"
                                onClick={() => handleDelete(category.id)}
                              >
                                Delete
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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