"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, Plus, Trash2, Target, CalendarClock, TrendingUp, PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStats, useBudgets, useCreateBudget, useDeleteBudget, useCategories, useCollections, useSession } from "@/hooks/queries";
import { api } from "@/lib/api-client";
import { formatCurrency, pct } from "@/lib/utils";
import { useSettingsCurrency } from "@/hooks/use-currency";

function CreateBudgetDialog() {
  const create = useCreateBudget();
  const { data: categories } = useCategories();
  const { data: collections } = useCollections();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState("GLOBAL");
  const [period, setPeriod] = useState("MONTHLY");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [collectionId, setCollectionId] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient"><Plus className="h-4 w-4" /> New Budget</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create budget</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PC Build fund" autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Scope</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="CATEGORY">Category</SelectItem>
                  <SelectItem value="COLLECTION">Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Period</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                  <SelectItem value="TOTAL">Total</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {scope === "CATEGORY" && (
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {scope === "COLLECTION" && (
            <div className="space-y-1.5">
              <Label>Collection</Label>
              <Select value={collectionId} onValueChange={setCollectionId}>
                <SelectTrigger><SelectValue placeholder="Select collection" /></SelectTrigger>
                <SelectContent>{collections?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5"><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="gradient"
            disabled={create.isPending || !name.trim() || !amount}
            onClick={() =>
              create.mutate(
                { name, scope, period, amount, categoryId: categoryId || null, collectionId: collectionId || null },
                { onSuccess: () => { toast.success("Budget created"); setOpen(false); setName(""); setAmount(""); }, onError: (e) => toast.error((e as Error).message) }
              )
            }
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BudgetPage() {
  const { data: stats, isLoading } = useStats();
  const { data: budgets } = useBudgets();
  const del = useDeleteBudget();
  const { data: session } = useSession();
  const currency = useSettingsCurrency();
  const qc = useQueryClient();
  const fc = (v: number) => formatCurrency(v, currency);

  const [monthly, setMonthly] = useState("");
  const [yearly, setYearly] = useState("");
  const [savings, setSavings] = useState("");

  async function saveTargets() {
    await api.patch("/api/settings", {
      monthlyBudget: monthly || null,
      yearlyBudget: yearly || null,
      savingsGoal: savings || null,
    });
    await qc.invalidateQueries();
    toast.success("Targets updated");
    setMonthly(""); setYearly(""); setSavings("");
  }

  if (isLoading || !stats) {
    return (
      <div>
        <PageHeader title="Budget & Goals" description="Plan spending and predict when you’ll complete your wishlist." icon={Wallet} />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const p = stats.prediction;

  return (
    <div className="space-y-6">
      <PageHeader title="Budget & Goals" description="Plan spending and predict when you’ll complete your wishlist." icon={Wallet}>
        {session?.isAdmin && <CreateBudgetDialog />}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Monthly Budget" value={p.monthlyBudget != null ? fc(p.monthlyBudget) : "—"} icon={CalendarClock} accent="#8b5cf6" />
        <StatCard label="Spent This Month" value={fc(p.thisMonthSpend)} icon={TrendingUp} accent="#22c55e" />
        <StatCard label="Avg Monthly Spend" value={fc(p.avgMonthlySpend)} icon={Wallet} accent="#06b6d4" />
        <StatCard label="Wishlist Remaining" value={fc(stats.totals.wishlistValue)} icon={Target} accent="#f59e0b" />
      </div>

      {/* Prediction */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 font-semibold"><CalendarClock className="h-4 w-4 text-primary" /> Completion forecast</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {p.completionDate ? (
                <>At {fc(p.avgMonthlySpend || p.monthlyBudget || 0)}/mo you’ll finish your wishlist around{" "}
                  <b className="text-foreground">
                    {new Date(p.completionDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </b>{" "}
                  ({p.monthsToComplete} months).</>
              ) : (
                "Set a monthly budget or acquire items to forecast a completion date."
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{stats.totals.completionPct}%</p>
            <p className="text-xs text-muted-foreground">acquired so far</p>
          </div>
        </div>
        {p.monthlyBudget != null && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">This month</span>
              <span>{fc(p.thisMonthSpend)} / {fc(p.monthlyBudget)}</span>
            </div>
            <Progress value={pct(p.thisMonthSpend, p.monthlyBudget)} />
          </div>
        )}
      </Card>

      {/* Savings goal */}
      {stats.totals.wishlistValue > 0 && p.monthlyBudget != null && (
        <Card className="p-6">
          <h3 className="flex items-center gap-2 font-semibold"><PiggyBank className="h-4 w-4 text-primary" /> Savings toward remaining wishlist</h3>
          <div className="mt-3">
            <Progress value={pct(stats.totals.totalSpent, stats.totals.totalSpent + stats.totals.wishlistValue)} className="h-3" />
            <p className="mt-1 text-xs text-muted-foreground">
              {fc(stats.totals.totalSpent)} invested · {fc(stats.totals.wishlistValue)} to go
            </p>
          </div>
        </Card>
      )}

      {/* Edit targets (admin) */}
      {session?.isAdmin && (
        <Card className="p-6">
          <h3 className="mb-3 font-semibold">Set targets</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5"><Label>Monthly budget</Label><Input type="number" placeholder={p.monthlyBudget?.toString() ?? "e.g. 500"} value={monthly} onChange={(e) => setMonthly(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Yearly budget</Label><Input type="number" placeholder={p.yearlyBudget?.toString() ?? "e.g. 6000"} value={yearly} onChange={(e) => setYearly(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Savings goal</Label><Input type="number" value={savings} onChange={(e) => setSavings(e.target.value)} /></div>
          </div>
          <Button variant="outline" className="mt-4" onClick={saveTargets}>Save targets</Button>
        </Card>
      )}

      {/* Budget list */}
      <div>
        <h3 className="mb-3 font-semibold">Budgets</h3>
        {!budgets?.length ? (
          <p className="rounded-2xl border border-dashed border-border/70 py-10 text-center text-sm text-muted-foreground">
            No custom budgets yet.{session?.isAdmin ? " Create one to track spending by category or collection." : ""}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((b) => {
              const spent = b.spent ?? 0;
              const progress = pct(spent, b.amount);
              const over = spent > b.amount;
              return (
                <Card key={b.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{b.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {b.period.toLowerCase()} · {b.category?.name ?? b.collection?.name ?? "global"}
                      </p>
                    </div>
                    {session?.isAdmin && (
                      <Button variant="ghost" size="icon-sm" onClick={() => del.mutate(b.id, { onSuccess: () => toast.success("Budget removed") })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className={over ? "text-destructive" : "text-muted-foreground"}>{fc(spent)}</span>
                      <span className="font-medium">{fc(b.amount)}</span>
                    </div>
                    <Progress value={progress} indicatorClassName={over ? "bg-destructive" : undefined} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
