"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationSelector } from "@/components/LocationSelector";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Minus } from "lucide-react";

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Location</DialogTitle>
          <DialogDescription>
            {locationType === "root" 
              ? "Create a parent location with at least one child location" 
              : "Create a child location under an existing parent"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Location Type</Label>
              <RadioGroup
                value={locationType}
                onValueChange={(value: LocationType) => {
                  setLocationType(value);
                  if (value === "root") {
                    setParentId(null);
                    setChildLocations([{ name: "", description: "" }]); // Reset with one empty child
                  }
                }}
                className="flex flex-col space-y-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="root" id="root" />
                  <Label htmlFor="root" className="cursor-pointer">Parent Location (Requires Children)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="child" id="child" />
                  <Label htmlFor="child" className="cursor-pointer">Child Location (Has Parent)</Label>
                </div>
              </RadioGroup>
            </div>

            {locationType === "child" && (
              <div className="space-y-2">
                <Label>Parent Location</Label>
                <LocationSelector
                  value={parentId || ""}
                  onChange={(id) => setParentId(id)}
                  className="max-h-[200px] overflow-y-auto border rounded-md"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Location Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter location name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter location description"
              />
            </div>

            {locationType === "root" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Child Locations (Required)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChildLocation}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child Location
                  </Button>
                </div>
                
                {childLocations.map((child, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-md relative">
                    {childLocations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-2 text-destructive"
                        onClick={() => removeChildLocation(index)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                    <div className="space-y-2">
                      <Label>Child Location Name</Label>
                      <Input
                        value={child.name}
                        onChange={(e) => updateChildLocation(index, "name", e.target.value)}
                        placeholder="Enter child location name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Child Location Description (optional)</Label>
                      <Input
                        value={child.description}
                        onChange={(e) => updateChildLocation(index, "description", e.target.value)}
                        placeholder="Enter child location description"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid()}
            >
              {isSubmitting ? "Creating..." : "Create Location"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 