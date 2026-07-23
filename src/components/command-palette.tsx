"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  LayoutDashboard,
  BarChart3,
  FolderHeart,
  DoorOpen,
  Wallet,
  Plus,
  Search,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useUi } from "@/store/ui";
import { api } from "@/lib/api-client";
import type { ItemsResponse } from "@/types";
import { formatCurrency, totalItemCost } from "@/lib/utils";
import { statusMeta } from "@/lib/constants";
import { useSession } from "@/hooks/queries";

const QUICK_LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/items", label: "All Items", icon: Package },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/collections", label: "Collections", icon: FolderHeart },
  { href: "/rooms", label: "Rooms", icon: DoorOpen },
  { href: "/budget", label: "Budget & Goals", icon: Wallet },
];

export function CommandPalette() {
  const open = useUi((s) => s.commandOpen);
  const setOpen = useUi((s) => s.setCommandOpen);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  const { data } = useQuery({
    queryKey: ["command-search", query],
    queryFn: () =>
      api.get<ItemsResponse>(`/api/items?q=${encodeURIComponent(query)}&pageSize=8&allUsers=true`),
    enabled: open && query.length > 0,
  });

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl gap-0 p-0 overflow-hidden">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search items, jump to pages…" />
          <CommandList>
            <CommandEmpty>{query ? "No matches found." : "Type to search…"}</CommandEmpty>

            {data?.items && data.items.length > 0 && (
              <CommandGroup heading="Items">
                {data.items.map((item) => (
                  <CommandItem key={item.id} value={item.id} onSelect={() => go(`/items/${item.slug}`)}>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs"
                      style={{ color: statusMeta(item.status).color }}
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-full w-full rounded-md object-cover" />
                      ) : (
                        <Package className="h-4 w-4" />
                      )}
                    </span>
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{formatCurrency(totalItemCost(item))}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {session?.isAuthenticated && (
              <CommandGroup heading="Actions">
                <CommandItem value="new-item" onSelect={() => go("/items/new")}>
                  <Plus className="h-4 w-4" /> Add new item
                </CommandItem>
              </CommandGroup>
            )}

            <CommandGroup heading="Navigate">
              {QUICK_LINKS.map((l) => (
                <CommandItem key={l.href} value={l.label} onSelect={() => go(l.href)}>
                  <l.icon className="h-4 w-4" /> {l.label}
                </CommandItem>
              ))}
              {query && (
                <CommandItem value="search-all" onSelect={() => go(`/items?q=${encodeURIComponent(query)}`)}>
                  <Search className="h-4 w-4" /> Search all items for “{query}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
