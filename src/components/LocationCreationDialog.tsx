"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSelector } from "@/components/LocationSelector";
import { Plus, Trash, FolderPlus, FolderTree } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LocationCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; parentId?: string }) => Promise<void>;
  parentId?: string;
}

type LocationType = "root" | "child";

interface ChildLocation {
  name: string;
  description: string;
}

export function LocationCreationDialog({
  isOpen,
  onClose,
  onSubmit,
  parentId: initialParentId,
}: LocationCreationDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | null>(initialParentId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationType, setLocationType] = useState<LocationType>(initialParentId ? "child" : "root");
  const [childLocations, setChildLocations] = useState<ChildLocation[]>([{ name: "", description: "" }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // First create the parent location if it's a root location
      if (locationType === "root") {
        // Create the parent location and get its response
        const response = await fetch("/api/locations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create parent location");
        }

        const parentLocation = await response.json();

        // Then create all child locations using the new parent's ID
        for (const child of childLocations) {
          if (child.name.trim()) {
            await onSubmit({
              name: child.name,
              description: child.description,
              parentId: parentLocation.id
            });
          }
        }
      } else {
        // Create a single child location
        await onSubmit({
          name,
          description,
          parentId: parentId || undefined,
        });
      }
      handleClose();
    } catch (error) {
      console.error("Failed to create location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setParentId(initialParentId || null);
    setLocationType(initialParentId ? "child" : "root");
    setChildLocations([{ name: "", description: "" }]); // Reset with one empty child location
    onClose();
  };

  const addChildLocation = () => {
    setChildLocations([...childLocations, { name: "", description: "" }]);
  };

  const removeChildLocation = (index: number) => {
    if (childLocations.length > 1) { // Prevent removing the last child location
      setChildLocations(childLocations.filter((_, i) => i !== index));
    }
  };

  const updateChildLocation = (index: number, field: keyof ChildLocation, value: string) => {
    const updatedLocations = [...childLocations];
    updatedLocations[index] = { ...updatedLocations[index], [field]: value };
    setChildLocations(updatedLocations);
  };

  // Validation function to check if form can be submitted
  const isFormValid = () => {
    if (isSubmitting) return false;
    if (!name.trim()) return false;
    
    if (locationType === "root") {
      // For root locations, require at least one child location with a name
      return childLocations.some(child => child.name.trim() !== "");
    } else {
      // For child locations, require a parent selection
      return !!parentId;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Location</DialogTitle>
          <DialogDescription>
            Add a new location to your inventory system
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="w-full">
            <div className="grid w-full grid-cols-2 mb-4 p-1 bg-muted border border-border rounded-md">
              <button
                type="button"
                onClick={() => setLocationType("root")}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-sm transition-all ${
                  locationType === "root" 
                    ? "bg-white shadow-md border-2 border-blue-500 font-medium text-blue-600" 
                    : "hover:bg-muted-foreground/10"
                }`}
              >
                <FolderTree className={`h-4 w-4 ${locationType === "root" ? "text-blue-500" : ""}`} />
                <span>Parent Location</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocationType("child");
                  if (initialParentId) {
                    setParentId(initialParentId);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-sm transition-all ${
                  locationType === "child" 
                    ? "bg-white shadow-md border-2 border-blue-500 font-medium text-blue-600" 
                    : "hover:bg-muted-foreground/10"
                }`}
              >
                <FolderPlus className={`h-4 w-4 ${locationType === "child" ? "text-blue-500" : ""}`} />
                <span>Child Location</span>
              </button>
            </div>
            
            {locationType === "root" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-name" className="text-sm font-medium">
                    Parent Location Name
                  </Label>
                  <Input
                    id="parent-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter parent location name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-description" className="text-sm font-medium">
                    Description (optional)
                  </Label>
                  <Input
                    id="parent-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter location description"
                  />
                </div>

                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Child Locations</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addChildLocation}
                      className="h-8 border-2 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Child
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {childLocations.map((child, index) => (
                      <div 
                        key={index} 
                        className="space-y-3 p-3 border-2 rounded-md bg-muted/30 relative hover:border-muted-foreground/50 transition-colors"
                      >
                        {childLocations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => removeChildLocation(index)}
                          >
                            <Trash className="h-3.5 w-3.5" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        )}
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Name</Label>
                          <Input
                            value={child.name}
                            onChange={(e) => updateChildLocation(index, "name", e.target.value)}
                            placeholder="Enter child location name"
                            className="h-8"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">Description (optional)</Label>
                          <Input
                            value={child.description}
                            onChange={(e) => updateChildLocation(index, "description", e.target.value)}
                            placeholder="Enter description"
                            className="h-8"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {locationType === "child" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Parent Location</Label>
                  <div className="border rounded-md">
                    <LocationSelector
                      value={parentId || ""}
                      onChange={(id) => setParentId(id)}
                      className="h-[200px] overflow-y-auto"
                      required
                    />
                  </div>
                  {!parentId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Select a parent location from the list above
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="child-name" className="text-sm font-medium">
                    Child Location Name
                  </Label>
                  <Input
                    id="child-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter child location name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="child-description" className="text-sm font-medium">
                    Description (optional)
                  </Label>
                  <Input
                    id="child-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter location description"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-2 hover:bg-muted/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid() || isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 border-2 border-primary"
            >
              {isSubmitting ? "Creating..." : "Create Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 