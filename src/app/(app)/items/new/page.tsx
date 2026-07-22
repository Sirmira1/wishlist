"use client";

import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ItemForm } from "@/components/items/item-form";

export default function NewItemPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Add New Item" description="Add anything you want to own, buy, upgrade, collect or build." icon={Plus} />
      <ItemForm />
    </div>
  );
}
