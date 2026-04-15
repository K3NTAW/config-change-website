"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json()) as {
        error?: string;
        mustChangePassword?: boolean;
      };

      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }

      if (data.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push("/");
      }
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#001D70]">
            Anmelden
          </h1>
          <p className="text-sm text-slate-500">
            NRT Rules Automation
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">TAA-Kennung</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="TAA1234"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Passwort</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#0055FF] hover:underline"
              >
                Passwort vergessen?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Anmelden…" : "Anmelden"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Noch kein Konto?{" "}
          <Link href="/register" className="text-[#0055FF] hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
