import { useState, useEffect } from "react";
import { ChevronRight, FolderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  name: string;
  description?: string | null;
  children: Location[];
  level: number;
  fullPath: string;
}

interface LocationSelectorProps {
  value?: string;
  onChange: (locationId: string) => void;
  className?: string;
  required?: boolean;
  refreshTrigger?: number;
}

export function LocationSelector({ value, onChange, className, required, refreshTrigger = 0 }: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch("/api/locations");
        if (!response.ok) throw new Error("Failed to fetch locations");
        const data = await response.json();
        setLocations(data);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, [refreshTrigger]);

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

  const renderLocation = (location: Location) => {
    const hasChildren = location.children && location.children.length > 0;
    const isExpanded = expandedLocations.has(location.id);
    const isSelected = location.id === value;
    const paddingLeft = `${location.level * 1.5}rem`;

    return (
      <div key={location.id}>
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-2 hover:bg-accent/50 cursor-pointer",
            isSelected && "bg-accent",
          )}
          style={{ paddingLeft }}
          onClick={() => onChange(location.id)}
        >
          {hasChildren && (
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                isExpanded && "rotate-90"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleLocation(location.id);
              }}
            />
          )}
          {!hasChildren && <div className="w-4" />}
          <FolderIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{location.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {location.children.map(renderLocation)}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading locations...</div>;
  }

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <div className="p-2">
        {locations.length === 0 ? (
          <div className="text-sm text-muted-foreground p-2">No locations found</div>
        ) : (
          locations.map(renderLocation)
        )}
      </div>
    </div>
  );
} 