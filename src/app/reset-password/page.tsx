"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * IPA-206: Reset-password page — reads ?token= from the URL (sent via email),
 * calls POST /api/auth/reset-password, then redirects to /login on success.
 */
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Kein Reset-Token gefunden. Bitte fordere einen neuen Link an.");
    }
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirm) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 px-4 py-4 text-sm text-green-700">
          Passwort erfolgreich zurückgesetzt. Du wirst weitergeleitet…
        </div>
        <Link
          href="/login"
          className="block text-center text-sm text-[#0055FF] hover:underline"
        >
          Jetzt anmelden
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="newPassword">Neues Passwort</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          autoFocus
          required
          disabled={!token}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm">Passwort bestätigen</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          disabled={!token}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading || !token}>
        {loading ? "Speichern…" : "Passwort speichern"}
      </Button>

      <p className="text-center text-sm text-slate-500">
        <Link href="/forgot-password" className="text-[#0055FF] hover:underline">
          Neuen Reset-Link anfordern
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_2px_20px_rgba(0,0,0,0.05)]">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[#001D70]">
            Neues Passwort setzen
          </h1>
          <p className="text-sm text-slate-500">
            Wähle ein neues Passwort für dein Konto.
          </p>
        </div>

        <Suspense fallback={<p className="text-center text-sm text-slate-400">Lade…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
