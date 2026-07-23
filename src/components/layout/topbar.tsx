"use client";

import Link from "next/link";
import { Menu, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminMenu } from "./admin-menu";
import { useUi } from "@/store/ui";
import { useSession } from "@/hooks/queries";

export function Topbar() {
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const setSidebarOpen = useUi((s) => s.setSidebarOpen);
  const setQuickAddOpen = useUi((s) => s.setQuickAddOpen);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <button
        onClick={() => setCommandOpen(true)}
        className="group flex h-10 flex-1 max-w-md items-center gap-2 rounded-lg border border-input bg-background/60 px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search everything…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        {session?.isAuthenticated && (
          <>
            <Button
              variant="gradient"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => setQuickAddOpen(true)}
            >
              <Plus className="h-4 w-4" /> Quick Add
            </Button>
            <Button asChild variant="gradient" size="icon" className="sm:hidden">
              <Link href="/items/new" aria-label="Add item">
                <Plus className="h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
        <ThemeToggle />
        <AdminMenu />
      </div>
    </header>
  );
}
