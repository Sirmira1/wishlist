"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Users, Menu, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUi } from "@/store/ui";
import { useSession } from "@/hooks/queries";

// Thumb-friendly bottom tab bar shown only on small screens. The "Menu" tab
// opens the full slide-out drawer, so every destination stays reachable.
export function MobileBottomNav() {
  const pathname = usePathname();
  const setSidebarOpen = useUi((s) => s.setSidebarOpen);
  const setQuickAddOpen = useUi((s) => s.setQuickAddOpen);
  const setCommandOpen = useUi((s) => s.setCommandOpen);
  const { data: session } = useSession();

  const tabs = [
    { key: "home", href: "/", label: "Home", icon: LayoutDashboard, active: pathname === "/" },
    { key: "items", href: "/items", label: "Items", icon: Package, active: pathname.startsWith("/items") },
    { key: "people", href: "/people", label: "People", icon: Users, active: pathname.startsWith("/people") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        <Tab {...tabs[0]} />
        <Tab {...tabs[1]} />

        {/* Center action: add (signed in) or search */}
        <button
          onClick={() => (session?.isAuthenticated ? setQuickAddOpen(true) : setCommandOpen(true))}
          className="relative flex w-16 flex-col items-center justify-center"
          aria-label={session?.isAuthenticated ? "Quick add" : "Search"}
        >
          <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(120deg,hsl(var(--primary)),hsl(189_94%_45%))] text-white shadow-lg shadow-primary/30">
            {session?.isAuthenticated ? <Plus className="h-6 w-6" /> : <Search className="h-5 w-5" />}
          </span>
        </button>

        <Tab {...tabs[2]} />
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
