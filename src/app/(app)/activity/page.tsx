"use client";

import { Activity as ActivityIcon } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ActivityFeed } from "@/components/activity-feed";

export default function ActivityPage() {
  return (
    <div>
      <PageHeader title="Activity Feed" description="A running history of everything that happens in your wishlist." icon={ActivityIcon} />
      <Card className="p-4 sm:p-6">
        <ActivityFeed limit={100} />
      </Card>
    </div>
  );
}
