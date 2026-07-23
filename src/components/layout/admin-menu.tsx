"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, ShieldCheck, User, UserPlus, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/hooks/queries";
import { api } from "@/lib/api-client";
import { initials } from "@/lib/utils";

export function AdminMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const qc = useQueryClient();

  // Signed out → offer sign in / sign up.
  if (!session?.isAuthenticated) {
    return (
      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login"><LogIn className="h-4 w-4" /> Sign in</Link>
        </Button>
        {session?.allowRegistration && (
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/register"><UserPlus className="h-4 w-4" /> Sign up</Link>
          </Button>
        )}
      </div>
    );
  }

  const name = session.displayName || session.username || "You";

  async function logout() {
    await api.post("/api/auth/logout");
    await qc.invalidateQueries();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {initials(name)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2 text-foreground">
          {session.isAdmin ? <ShieldCheck className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />}
          <span className="flex-1 truncate">{name}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
            {session.role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/"><LayoutDashboard /> My wishlist</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Account & settings</Link>
        </DropdownMenuItem>
        {session.isAdmin && (
          <>
            <DropdownMenuItem asChild><Link href="/import">Import / Export</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link href="/backup">Backup</Link></DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
