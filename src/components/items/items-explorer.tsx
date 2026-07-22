"use client";

import { useEffect } from "react";
import { PackageOpen } from "lucide-react";
import { FilterBar } from "./filter-bar";
import { GalleryView, TableView, ListView, KanbanView, TimelineView } from "./item-views";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useItems } from "@/hooks/queries";
import { useUi, type Filters } from "@/store/ui";

export function ItemsExplorer({ initialFilters }: { initialFilters?: Partial<Filters> }) {
  const { filters, view, setFilters } = useUi();

  // Apply any page-level preset filters once on mount (e.g. category page).
  useEffect(() => {
    if (initialFilters) setFilters(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isError } = useItems({ ...filters, pageSize: 200 });
  const items = data?.items ?? [];

  return (
    <div>
      <FilterBar />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={PackageOpen}
          title="Couldn’t load items"
          description="Public viewing may be disabled, or something went wrong."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="No items match"
          description="Try adjusting your filters, or add your first item to the wishlist."
          action={
            <Button asChild variant="gradient">
              <a href="/items/new">Add an item</a>
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
          {view === "gallery" && <GalleryView items={items} />}
          {view === "grid" && <GalleryView items={items} />}
          {view === "table" && <TableView items={items} />}
          {view === "list" && <ListView items={items} />}
          {view === "kanban" && <KanbanView items={items} />}
          {view === "timeline" && <TimelineView items={items} />}
        </>
      )}
    </div>
  );
}
