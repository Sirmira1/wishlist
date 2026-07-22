"use client";

import { use } from "react";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ItemForm } from "@/components/items/item-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useItem } from "@/hooks/queries";

export default function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: item, isLoading } = useItem(id);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Edit Item" description={item?.title} icon={Pencil} />
      {isLoading || !item ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : (
        <ItemForm item={item} />
      )}
    </div>
  );
}
