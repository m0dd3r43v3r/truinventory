"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export default function InventoryPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-4">
          {/* Table will be added here */}
          <p className="text-muted-foreground">No items found.</p>
        </div>
      </div>

      {/* Add Modal will be added here */}
    </div>
  );
} 