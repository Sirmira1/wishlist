"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "./nav-config";
import { useSession } from "@/hooks/queries";
import { motion } from "framer-motion";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.isAdmin;
  const isAuth = session?.isAuthenticated;

  return (
    <div className="flex h-full flex-col gap-1">
      <Link
        href="/"
        onClick={onNavigate}
        className="mb-4 flex items-center gap-2.5 px-2 py-1"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(120deg,hsl(var(--primary)),hsl(189_94%_45%))] text-white shadow-md shadow-primary/30">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-gradient">Life Wishlist</div>
          <div className="text-[11px] text-muted-foreground">Everything I want</div>
        </div>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto no-scrollbar pb-4">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter(
            (i) => (!i.adminOnly || isAdmin) && (!i.authOnly || isAuth)
          );
          if (!items.length) return null;
          return (
            <div key={section.title}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-primary/20"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <item.icon className="relative z-10 h-[18px] w-[18px] shrink-0" />
                      <span className="relative z-10 flex-1">{item.label}</span>
                      {item.adminOnly && (
                        <Lock className="relative z-10 h-3 w-3 opacity-50" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        {isAdmin ? (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Admin · {session?.username}
          </span>
        ) : isAuth ? (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> {session?.displayName || session?.username}
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> Viewing publicly
          </span>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl px-3 py-5">
      <SidebarContent />
    </aside>
  );
}
