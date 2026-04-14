"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Minimales Sign-up-UI für lokale E2E-Prüfung (IPA-202).
 * Produktives Styling folgt mit Design-System der App.
 */
export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = (await res.json()) as { error?: string; id?: string; status?: string };
      if (!res.ok) {
        setMsg(data.error ?? `HTTP ${res.status}`);
      } else {
        setMsg(`Antrag erstellt: ${data.id} (${data.status})`);
      }
    } catch {
      setMsg("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Registrierung (IPA-202)</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">TAA-Kennung</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="TAA1234"
            autoComplete="username"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Swisscom E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vorname.nachname@swisscom.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Passwort (min. 12 Zeichen)</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Senden…" : "Antrag senden"}
        </Button>
      </form>
      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
