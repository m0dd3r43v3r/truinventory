"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Plus, PencilIcon, Trash2Icon, ChevronRight, FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { LocationCreationDialog } from "@/components/LocationCreationDialog";
import { LocationEditDialog } from "@/components/LocationEditDialog";

interface Location {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  level: number;
  fullPath: string;
  children: Location[];
  itemCount: number;
  directItemCount: number;
}

function LocationNode({ 
  location, 
  onEdit, 
  onDelete, 
  onAddChild,
  expanded,
  onToggle,
  expandedLocations,
  toggleLocation,
}: { 
  location: Location;
  onEdit: (location: Location) => void;
  onDelete: (location: Location) => void;
  onAddChild: (parentId: string) => void;
  expanded: boolean;
  onToggle: () => void;
  expandedLocations: Set<string>;
  toggleLocation: (locationId: string) => void;
}) {
  const hasChildren = location.children && location.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-4 hover:bg-accent/50 group"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            expanded && "rotate-90",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <FolderIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="truncate flex items-center">
            <span>{location.name}</span>
            {location.itemCount > 0 && (
              <span className="text-xs text-primary-foreground bg-primary px-2 py-0.5 rounded-full ml-2">
                {location.itemCount} {location.itemCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          {location.description && (
            <div className="text-sm text-muted-foreground truncate">
              {location.description}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(location.id);
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add Child Location</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(location);
            }}
          >
            <PencilIcon className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(location);
            }}
          >
            <Trash2Icon className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="ml-6">
          {location.children.map((child) => (
            <LocationNode
              key={child.id}
              location={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              expanded={expandedLocations.has(child.id)}
              onToggle={() => toggleLocation(child.id)}
              expandedLocations={expandedLocations}
              toggleLocation={toggleLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationsPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | undefined>();
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [parentIdForAdd, setParentIdForAdd] = useState<string | undefined>();
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLocations();
  }, []);

  async function fetchLocations() {
    try {
      const response = await fetch("/api/locations");
      if (!response.ok) throw new Error("Failed to fetch locations");
      const data = await response.json();
      
      console.log('Raw locations data:', data);

      // The API now returns the properly structured tree
      // No need to restructure the data here
      setLocations(data);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch locations",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreate = async (data: { name: string; description: string; parentId?: string }) => {
    try {
      const response = await fetch("/api/locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create location");
      }

      const newLocation = await response.json();
      
      // If this is a child location, expand the parent
      if (data.parentId) {
        setExpandedLocations((prev) => {
          const next = new Set(prev);
          next.add(data.parentId!);
          return next;
        });
      }

      toast({
        title: "Success",
        description: "Location created successfully",
      });

      setIsCreateModalOpen(false);
      setParentIdForAdd(undefined);
      fetchLocations();
    } catch (error) {
      console.error("Failed to create location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create location",
      });
    }
  };

  const handleEdit = async (data: { name: string; description: string }) => {
    if (!locationToEdit) return;

    try {
      const response = await fetch(`/api/locations/${locationToEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to update location");
      }

      toast({
        title: "Success",
        description: "Location updated successfully",
      });

      setIsEditModalOpen(false);
      setLocationToEdit(undefined);
      fetchLocations();
    } catch (error) {
      console.error("Failed to update location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update location",
      });
    }
  };

  const handleDelete = async (location: Location) => {
    try {
      const response = await fetch(`/api/locations/${location.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to delete location");
      }

      toast({
        title: "Success",
        description: "Location deleted successfully",
      });

      fetchLocations();
    } catch (error) {
      console.error("Failed to delete location:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete location",
      });
    } finally {
      setLocationToDelete(null);
    }
  };

  const toggleLocation = (locationId: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Locations</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : locations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No locations found. Click "Add Location" to create one.
          </div>
        ) : (
          <div className="p-2">
            {locations.map((location) => (
              <LocationNode
                key={location.id}
                location={location}
                onEdit={(loc) => {
                  setLocationToEdit(loc);
                  setIsEditModalOpen(true);
                }}
                onDelete={(loc) => setLocationToDelete(loc)}
                onAddChild={(parentId) => {
                  setParentIdForAdd(parentId);
                  setIsCreateModalOpen(true);
                }}
                expanded={expandedLocations.has(location.id)}
                onToggle={() => toggleLocation(location.id)}
                expandedLocations={expandedLocations}
                toggleLocation={toggleLocation}
              />
            ))}
          </div>
        )}
      </div>

      <LocationCreationDialog
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setParentIdForAdd(undefined);
        }}
        onSubmit={handleCreate}
        parentId={parentIdForAdd}
      />

      {locationToEdit && (
        <LocationEditDialog
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setLocationToEdit(undefined);
          }}
          onSubmit={handleEdit}
          location={locationToEdit}
        />
      )}

      {locationToDelete && (
        <AlertDialog open onOpenChange={(open) => !open && setLocationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle asChild>
                <h2>Are you sure?</h2>
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <p>
                  This action cannot be undone. This will permanently delete the location
                  and all its child locations.
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
                  onClick={() => handleDelete(locationToDelete)}
                >
                  Delete
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
} 