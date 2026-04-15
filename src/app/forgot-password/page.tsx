"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }

      setSubmitted(true);
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
            Passwort zurücksetzen
          </h1>
          <p className="text-sm text-slate-500">
            Gib deine TAA-Kennung ein. Du erhältst eine E-Mail mit einem Reset-Link.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 px-4 py-4 text-sm text-green-700">
              Falls ein Konto mit dieser Kennung existiert, wurde eine Reset-E-Mail versendet.
              Bitte überprüfe dein Postfach.
            </div>
            <Link
              href="/login"
              className="block text-center text-sm text-[#0055FF] hover:underline"
            >
              Zurück zur Anmeldung
            </Link>
          </div>
        ) : (
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

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Senden…" : "Reset-Link anfordern"}
            </Button>

            <p className="text-center text-sm text-slate-500">
              <Link href="/login" className="text-[#0055FF] hover:underline">
                Zurück zur Anmeldung
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
