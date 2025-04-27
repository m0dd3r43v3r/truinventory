import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  siblingsCount?: number;
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  siblingsCount = 1,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // If there's only 1 page, don't render pagination
  if (totalPages <= 1) {
    return null;
  }

  // Generate page numbers to display
  const generatePagination = () => {
    // Always show first page
    const firstPage = 1;
    // Always show last page
    const lastPage = totalPages;
    
    // Calculate range of pages to show around current page
    const leftSiblingIndex = Math.max(currentPage - siblingsCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingsCount, totalPages);

    // Determine if we should show ellipses
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Initialize array of page numbers to show
    const pages: (number | string)[] = [];

    // Always add first page
    pages.push(firstPage);

    // Add left ellipsis if needed
    if (shouldShowLeftDots) {
      pages.push("leftEllipsis");
    }

    // Add pages around current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== firstPage && i !== lastPage) {
        pages.push(i);
      }
    }

    // Add right ellipsis if needed
    if (shouldShowRightDots) {
      pages.push("rightEllipsis");
    }

    // Always add last page if it's not the same as first page
    if (lastPage !== firstPage) {
      pages.push(lastPage);
    }

    return pages;
  };

  const pages = generatePagination();

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-8 w-8",
          currentPage === 1 && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((page, i) => {
        if (typeof page === "string") {
          return (
            <span
              key={`ellipsis-${page}-${i}`}
              className="flex h-8 w-8 items-center justify-center"
            >
              <MoreHorizontal className="h-4 w-4" />
            </span>
          );
        }

        return (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page)}
            className={cn(
              buttonVariants({ variant: currentPage === page ? "default" : "outline" }),
              "h-8 w-8 p-0"
            )}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        );
      })}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-8 w-8",
          currentPage === totalPages && "opacity-50 cursor-not-allowed"
        )}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
} 