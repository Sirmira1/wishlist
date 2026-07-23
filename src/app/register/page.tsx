"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import type { Session } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    api.get<Session>("/api/auth/session").then((s) => {
      if (!s.setupComplete) router.replace("/setup");
      else if (s.isAuthenticated) router.replace("/");
      else setAllowed(s.allowRegistration);
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don’t match");
    setLoading(true);
    try {
      await api.post("/api/auth/register", { username, displayName, password });
      await qc.invalidateQueries();
      toast.success("Welcome! Your wishlist is ready 🎉");
      router.replace("/");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(120deg,hsl(var(--primary)),hsl(189_94%_45%))] text-white shadow-lg shadow-primary/30">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Create your wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign up to track everything you want to own, buy or build.
          </p>
        </div>

        {!allowed ? (
          <div className="rounded-lg border border-border/70 bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            Sign-ups are currently closed. Please check back later.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_handle" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Display name (optional)</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="How your name appears" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Create account
            </Button>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
        <div className="mt-2 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to wishlist</Link>
        </div>
      </Card>
    </div>
  );
}
