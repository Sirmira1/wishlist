"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Palette, ShieldCheck, Eye, KeyRound, RefreshCw, Check, User, Globe } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { ACCENT_COLORS, CURRENCIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useSession, useMe } from "@/hooks/queries";

type SiteSettings = {
  accentColor: string;
  currency: string;
  publicViewing: boolean;
  allowRegistration: boolean;
  autoLogoutMinutes?: number;
  isAdmin?: boolean;
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const isAdmin = session?.isAdmin;
  const { data: me } = useMe(Boolean(session?.isAuthenticated));
  const { data: site } = useQuery<SiteSettings>({ queryKey: ["settings", "admin"], queryFn: () => api.get("/api/settings") });

  // Account (all users)
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetCode, setResetCode] = useState<string | null>(null);

  // Site (admin)
  const [accent, setAccent] = useState("violet");
  const [currency, setCurrency] = useState("USD");
  const [publicViewing, setPublicViewing] = useState(true);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [autoLogout, setAutoLogout] = useState("30");

  useEffect(() => {
    if (me) {
      setUsername(me.username);
      setDisplayName(me.displayName ?? "");
    }
  }, [me]);
  useEffect(() => {
    if (site) {
      setAccent(site.accentColor);
      setCurrency(site.currency);
      setPublicViewing(site.publicViewing);
      setAllowRegistration(site.allowRegistration);
      if (site.autoLogoutMinutes) setAutoLogout(String(site.autoLogoutMinutes));
    }
  }, [site]);

  async function saveAccount() {
    try {
      await api.patch("/api/me", { username, displayName });
      await qc.invalidateQueries();
      toast.success("Account updated");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function saveSite() {
    await api.patch("/api/settings", { accentColor: accent, currency, publicViewing, allowRegistration, autoLogoutMinutes: Number(autoLogout), theme });
    await qc.invalidateQueries();
    toast.success("Site settings saved");
  }

  async function applyAccent(name: string) {
    setAccent(name);
    const a = ACCENT_COLORS.find((c) => c.name === name);
    if (a) {
      document.documentElement.style.setProperty("--primary", a.value);
      document.documentElement.style.setProperty("--ring", a.value);
    }
    if (isAdmin) {
      await api.patch("/api/settings", { accentColor: name });
      qc.invalidateQueries({ queryKey: ["settings"] });
    }
  }

  async function changePassword() {
    try {
      await api.post("/api/auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed");
      setCurrentPassword(""); setNewPassword("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function generateResetCode() {
    try {
      const res = await api.post<{ code: string }>("/api/auth/reset-code");
      setResetCode(res.code);
      toast.success("Recovery code generated — store it safely!");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function regenerateTokens() {
    try {
      await api.post("/api/auth/regenerate");
      toast.success("Session tokens regenerated — other devices signed out");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Manage your account, appearance and security." icon={SettingsIcon} />

      <Tabs defaultValue="account">
        <TabsList className="flex-wrap">
          <TabsTrigger value="account"><User className="h-4 w-4" /> Account</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="h-4 w-4" /> Appearance</TabsTrigger>
          {isAdmin && <TabsTrigger value="site"><Globe className="h-4 w-4" /> Site</TabsTrigger>}
        </TabsList>

        {/* ACCOUNT */}
        <TabsContent value="account" className="space-y-4">
          <Card className="space-y-4 p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              {isAdmin ? <ShieldCheck className="h-4 w-4 text-primary" /> : <User className="h-4 w-4" />} Profile
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
            </div>
            <Button variant="gradient" onClick={saveAccount}>Save profile</Button>
          </Card>

          <Card className="space-y-4 p-6">
            <h3 className="flex items-center gap-2 font-semibold"><KeyRound className="h-4 w-4" /> Change password</h3>
            <div className="space-y-1.5"><Label>Current password</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>New password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
            <Button variant="gradient" disabled={!currentPassword || newPassword.length < 8} onClick={changePassword}>Update password</Button>
          </Card>

          <Card className="space-y-4 p-6">
            <h3 className="font-semibold">Recovery & sessions</h3>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Password recovery code</p>
                <p className="text-sm text-muted-foreground">
                  {me?.hasResetCode ? "A recovery code is active." : "Generate a code to recover access if you’re locked out."}
                </p>
              </div>
              <Button variant="outline" onClick={generateResetCode}>Generate code</Button>
            </div>
            {resetCode && (
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">Save this somewhere safe — it won’t be shown again:</p>
                <p className="mt-1 select-all font-mono text-lg font-bold tracking-wider text-primary">{resetCode}</p>
              </div>
            )}
            <Separator />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Regenerate session tokens</p>
                <p className="text-sm text-muted-foreground">Sign out all your other devices immediately.</p>
              </div>
              <Button variant="outline" onClick={regenerateTokens}><RefreshCw className="h-4 w-4" /> Regenerate</Button>
            </div>
          </Card>
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance" className="space-y-4">
          <Card className="space-y-5 p-6">
            <div>
              <Label className="mb-2 block">Theme</Label>
              <div className="flex gap-2">
                {["light", "dark", "system"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-3 text-sm font-medium capitalize transition-colors",
                      theme === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">Theme is saved per device.</p>
            </div>

            {isAdmin && (
              <>
                <div>
                  <Label className="mb-2 block">Accent color (site-wide)</Label>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => applyAccent(c.name)}
                        className={cn("flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-background transition", accent === c.name ? "ring-foreground" : "ring-transparent")}
                        style={{ background: `hsl(${c.value})` }}
                        aria-label={c.name}
                      >
                        {accent === c.name && <Check className="h-4 w-4 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Currency (site-wide)</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button variant="gradient" onClick={saveSite}>Save appearance</Button>
              </>
            )}
          </Card>
        </TabsContent>

        {/* SITE (admin) */}
        {isAdmin && (
          <TabsContent value="site" className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold"><Eye className="h-4 w-4" /> Public viewing</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Allow anyone (signed out) to browse wishlists, charts and search.</p>
                </div>
                <Switch checked={publicViewing} onCheckedChange={setPublicViewing} />
              </div>
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold"><User className="h-4 w-4" /> Open registration</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Let anyone create their own account and wishlist.</p>
                </div>
                <Switch checked={allowRegistration} onCheckedChange={setAllowRegistration} />
              </div>
              <Separator className="my-4" />
              <div className="space-y-1.5">
                <Label>Auto-logout (minutes of inactivity)</Label>
                <Input type="number" min={5} max={1440} value={autoLogout} onChange={(e) => setAutoLogout(e.target.value)} className="w-40" />
              </div>
              <Button variant="gradient" className="mt-4" onClick={saveSite}>Save site settings</Button>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
