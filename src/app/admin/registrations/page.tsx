"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type Pending = { id: string; username: string; email: string; createdAt: string };

export default function AdminRegistrationsPage() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const toast = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/registration-requests");
      const data = (await res.json()) as { items?: Pending[]; error?: string };
      if (!res.ok) { toast(data.error ?? `HTTP ${res.status}`, false); return; }
      setPending(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPending(); }, [loadPending]);

  async function approve(id: string) {
    const res = await fetch(`/api/admin/registration-requests/${id}/approve`, { method: "POST" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) { toast(data.error ?? `HTTP ${res.status}`, false); return; }
    toast("Genehmigt. Temporäres Passwort per E-Mail / Log ausgegeben.");
    await loadPending();
  }

  async function reject(id: string) {
    const reason = window.prompt("Ablehnungsgrund (optional):") ?? "";
    const res = await fetch(`/api/admin/registration-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason || undefined }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) { toast(data.error ?? `HTTP ${res.status}`, false); return; }
    toast("Antrag abgelehnt.");
    await loadPending();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#001D70]">Registrierungsanträge</h1>
          <p className="mt-1 text-sm text-slate-500">Ausstehende Anträge freigeben oder ablehnen.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPending} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {msg && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${msg.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {msg.text}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Kennung</th>
              <th className="px-5 py-3">E-Mail</th>
              <th className="px-5 py-3">Eingegangen</th>
              <th className="px-5 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Wird geladen…</td></tr>
            )}
            {!loading && pending.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Keine ausstehenden Anträge.</td></tr>
            )}
            {pending.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">{p.username}</td>
                <td className="px-5 py-3 text-slate-500">{p.email}</td>
                <td className="px-5 py-3 text-slate-500">{new Date(p.createdAt).toLocaleString("de-CH")}</td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button size="sm" onClick={() => void approve(p.id)}>Genehmigen</Button>
                    <Button size="sm" variant="outline" onClick={() => void reject(p.id)}>Ablehnen</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
