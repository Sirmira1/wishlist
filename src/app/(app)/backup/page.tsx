"use client";

import { useState } from "react";
import { DatabaseBackup, Download, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";

export default function BackupPage() {
  const qc = useQueryClient();
  const [wipe, setWipe] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await api.post<{ itemsRestored: number }>("/api/backup", { ...data, wipe });
      await qc.invalidateQueries();
      toast.success(`Restored ${res.itemsRestored} items`);
    } catch (err) {
      toast.error("Restore failed — is this a valid backup file?");
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Backup & Restore" description="Safeguard everything, or move your data between deployments." icon={DatabaseBackup} />

      <Card className="mb-6 p-6">
        <h3 className="flex items-center gap-2 font-semibold"><Download className="h-4 w-4" /> Download backup</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Exports all items, categories, collections, rooms, budgets, vehicles and price history as a single JSON file.
          Credentials and secrets are never included.
        </p>
        <Button asChild variant="gradient" className="mt-4"><a href="/api/backup">Download full backup</a></Button>
      </Card>

      <Card className="p-6">
        <h3 className="flex items-center gap-2 font-semibold"><Upload className="h-4 w-4" /> Restore from backup</h3>
        <p className="mt-1 text-sm text-muted-foreground">Upload a backup JSON file to import its contents.</p>

        <label className="mt-4 flex items-center justify-between rounded-lg border border-border/70 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <div>
              <Label>Replace existing data</Label>
              <p className="text-xs text-muted-foreground">Wipe current items before restoring (destructive).</p>
            </div>
          </div>
          <Switch checked={wipe} onCheckedChange={setWipe} />
        </label>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border/70 px-6 py-10 text-center transition-colors hover:border-primary/50">
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">{restoring ? "Restoring…" : "Choose a backup file"}</span>
          <input type="file" accept="application/json,.json" className="hidden" onChange={handleRestore} disabled={restoring} />
        </label>
      </Card>
    </div>
  );
}
