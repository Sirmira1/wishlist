"use client";

import { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Star,
  X,
  LayoutGrid,
  Table as TableIcon,
  List,
  KanbanSquare,
  GanttChartSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUi } from "@/store/ui";
import { useCategories } from "@/hooks/queries";
import { STATUSES, PRIORITIES, type ViewMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

const VIEWS: { value: ViewMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { value: "gallery", icon: LayoutGrid, label: "Gallery" },
  { value: "table", icon: TableIcon, label: "Table" },
  { value: "list", icon: List, label: "List" },
  { value: "kanban", icon: KanbanSquare, label: "Kanban" },
  { value: "timeline", icon: GanttChartSquare, label: "Timeline" },
];

const SORTS = [
  { value: "createdAt", label: "Date Added" },
  { value: "updatedAt", label: "Date Updated" },
  { value: "price", label: "Price" },
  { value: "total", label: "Total Cost" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Alphabetical" },
  { value: "status", label: "Status" },
  { value: "dateAcquired", label: "Date Acquired" },
];

export function FilterBar() {
  const { filters, setFilters, resetFilters, view, setView } = useUi();
  const { data: categories } = useCategories();
  const [localQ, setLocalQ] = useState(filters.q);

  // Debounce the search box into the store.
  useEffect(() => {
    const t = setTimeout(() => setFilters({ q: localQ }), 300);
    return () => clearTimeout(t);
  }, [localQ, setFilters]);

  useEffect(() => setLocalQ(filters.q), [filters.q]);

  const activeCount =
    filters.status.length +
    filters.priority.length +
    (filters.categoryId ? 1 : 0) +
    (filters.favorite ? 1 : 0) +
    (filters.minPrice || filters.maxPrice ? 1 : 0);

  function toggleStatus(v: string) {
    setFilters({
      status: filters.status.includes(v)
        ? filters.status.filter((s) => s !== v)
        : [...filters.status, v],
    });
  }
  function togglePriority(v: string) {
    setFilters({
      priority: filters.priority.includes(v)
        ? filters.priority.filter((s) => s !== v)
        : [...filters.priority, v],
    });
  }

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:min-w-[200px] sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            placeholder="Search items…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
        <Select value={filters.categoryId ?? "all"} onValueChange={(v) => setFilters({ categoryId: v === "all" ? undefined : v })}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && <Badge className="ml-1 h-5 px-1.5">{activeCount}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Status</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {STATUSES.map((s) => (
                    <label key={s.value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={filters.status.includes(s.value)} onCheckedChange={() => toggleStatus(s.value)} />
                      <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Priority</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {PRIORITIES.map((p) => (
                    <label key={p.value} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={filters.priority.includes(p.value)} onCheckedChange={() => togglePriority(p.value)} />
                      <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Price range</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice ?? ""}
                    onChange={(e) => setFilters({ minPrice: e.target.value || undefined })}
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice ?? ""}
                    onChange={(e) => setFilters({ maxPrice: e.target.value || undefined })}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant={filters.favorite ? "default" : "outline"}
          size="icon"
          aria-label="Favorites only"
          onClick={() => setFilters({ favorite: filters.favorite ? undefined : true })}
        >
          <Star className={cn("h-4 w-4", filters.favorite && "fill-current")} />
        </Button>

        <Select value={filters.sort} onValueChange={(v) => setFilters({ sort: v })}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          aria-label="Toggle sort order"
          onClick={() => setFilters({ order: filters.order === "asc" ? "desc" : "asc" })}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border/60 bg-card/40 p-1 no-scrollbar w-full sm:w-fit">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              view === v.value ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={v.label}
          >
            <v.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
