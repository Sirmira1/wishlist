import { redirect } from "next/navigation";
import { isSetupComplete } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { CommandPalette } from "@/components/command-palette";
import { QuickAddDialog } from "@/components/quick-add-dialog";
import { AutoLogout } from "@/components/auto-logout";

// This layout reads the DB (setup check) and session cookies — never prerender it.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // First-run: force the admin to create credentials before anything else.
  if (!(await isSetupComplete())) redirect("/setup");

  return (
    <div className="flex min-h-screen overflow-x-clip">
      <Sidebar />
      <MobileNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {/* Extra bottom padding on mobile so content clears the bottom nav bar. */}
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
      <CommandPalette />
      <QuickAddDialog />
      <AutoLogout />
    </div>
  );
}
