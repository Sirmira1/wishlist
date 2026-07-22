"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Package, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ItemsExplorer } from "@/components/items/items-explorer";
import { useSession } from "@/hooks/queries";
import type { Filters } from "@/store/ui";

function ItemsInner() {
  const params = useSearchParams();
  const { data: session } = useSession();

  const initial: Partial<Filters> = {};
  if (params.get("q")) initial.q = params.get("q")!;
  if (params.get("sort")) initial.sort = params.get("sort")!;
  if (params.get("categoryId")) initial.categoryId = params.get("categoryId")!;

  return (
    <div>
      <PageHeader title="All Items" description="Everything you want to own, buy, upgrade or collect." icon={Package}>
        {session?.isAdmin && (
          <Button asChild variant="gradient">
            <Link href="/items/new">
              <Plus className="h-4 w-4" /> New Item
            </Link>
          </Button>
        )}
      </PageHeader>
      <ItemsExplorer initialFilters={Object.keys(initial).length ? initial : undefined} />
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={null}>
      <ItemsInner />
    </Suspense>
  );
}
