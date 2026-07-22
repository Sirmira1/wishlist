"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Upload, Download, FileSpreadsheet, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

// Item fields users can map CSV columns onto.
const FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description" },
  { key: "category", label: "Category (name)" },
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "msrp", label: "MSRP" },
  { key: "currentPrice", label: "Current Price" },
  { key: "discountPrice", label: "Discount Price" },
  { key: "url", label: "Product URL" },
  { key: "imageUrl", label: "Image URL" },
  { key: "tags", label: "Tags (;/,)" },
  { key: "quantityDesired", label: "Quantity" },
  { key: "store", label: "Store" },
  { key: "sku", label: "SKU" },
];

function autoGuess(columns: string[], field: string): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const target = norm(field);
  return columns.find((c) => norm(c) === target) || columns.find((c) => norm(c).includes(target)) || "";
}

export default function ImportPage() {
  const qc = useQueryClient();
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields ?? [];
        setColumns(cols);
        setRows(res.data);
        const guessed: Record<string, string> = {};
        for (const f of FIELDS) guessed[f.key] = autoGuess(cols, f.key);
        setMapping(guessed);
        setResult(null);
        toast.success(`Parsed ${res.data.length} rows`);
      },
      error: () => toast.error("Could not parse file"),
    });
  }

  async function runImport() {
    if (!mapping.title) {
      toast.error("Map the Title column first");
      return;
    }
    setImporting(true);
    try {
      const items = rows.map((row) => {
        const obj: Record<string, unknown> = {};
        for (const f of FIELDS) {
          const col = mapping[f.key];
          if (col && row[col] !== undefined && row[col] !== "") obj[f.key] = row[col];
        }
        return obj;
      }).filter((o) => o.title);
      const res = await api.post<{ created: number; failed: number }>("/api/import", { items });
      setResult(res);
      await qc.invalidateQueries();
      toast.success(`Imported ${res.created} items`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Import / Export" description="Bring in spreadsheets or back your data out as CSV/JSON." icon={Upload} />

      {/* Export */}
      <Card className="mb-6 p-6">
        <h3 className="flex items-center gap-2 font-semibold"><Download className="h-4 w-4" /> Export</h3>
        <p className="mt-1 text-sm text-muted-foreground">Download your entire wishlist.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="outline"><a href="/api/export?format=csv">CSV (Excel)</a></Button>
          <Button asChild variant="outline"><a href="/api/export?format=json">JSON</a></Button>
          <Button asChild variant="outline"><a href="/api/backup">Full backup (JSON)</a></Button>
        </div>
      </Card>

      {/* Import */}
      <Card className="p-6">
        <h3 className="flex items-center gap-2 font-semibold"><FileSpreadsheet className="h-4 w-4" /> Import from CSV</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Works with PCPartPicker exports, wishlist exports and custom spreadsheets.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border/70 px-6 py-10 text-center transition-colors hover:border-primary/50">
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">Choose a CSV file</span>
          <span className="text-xs text-muted-foreground">or drag it here</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
        </label>

        {columns.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 text-sm font-semibold">Map fields</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <Label className="w-32 shrink-0 text-xs">
                    {f.label}{f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Select
                    value={mapping[f.key] || "none"}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v === "none" ? "" : v }))}
                  >
                    <SelectTrigger className="h-9"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— skip —</SelectItem>
                      {columns.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{rows.length} rows ready</span>
              <Button variant="gradient" onClick={runImport} disabled={importing}>
                {importing ? "Importing…" : `Import ${rows.length} items`}
              </Button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Imported <b>{result.created}</b> items{result.failed ? `, ${result.failed} skipped` : ""}.
          </div>
        )}
      </Card>
    </div>
  );
}
