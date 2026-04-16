"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw } from "lucide-react";

type Pending = { id: string; username: string; email: string; createdAt: string };

export default function AdminRegistrationsPage() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Pending | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const reasonFieldHintId = useId();

  const toast = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/registration-requests");
      const data = (await res.json()) as { items?: Pending[]; error?: string };
      if (!res.ok) {
        toast(data.error ?? `HTTP ${res.status}`, false);
        return;
      }
      setPending(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  async function approve(id: string) {
    const res = await fetch(
      `/api/admin/registration-requests/${id}/approve`,
      { method: "POST" },
    );
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast(data.error ?? `HTTP ${res.status}`, false);
      return;
    }
    toast("Genehmigt. Temporäres Passwort per E-Mail / Log ausgegeben.");
    await loadPending();
  }

  function openReject(p: Pending) {
    setRejectTarget(p);
    setRejectReason("");
    setRejectOpen(true);
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    const res = await fetch(
      `/api/admin/registration-requests/${rejectTarget.id}/reject`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: rejectReason.trim() || undefined,
        }),
      },
    );
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      toast(data.error ?? `HTTP ${res.status}`, false);
      return;
    }
    toast("Antrag abgelehnt.");
    setRejectOpen(false);
    setRejectTarget(null);
    await loadPending();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1
            id="admin-registrations-title"
            className="text-2xl font-semibold tracking-tight text-[#001D70]"
          >
            Registrierungsanträge
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ausstehende Anträge freigeben oder ablehnen.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPending}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            aria-hidden
          />
          Aktualisieren
        </Button>
      </div>

      {msg && (
        <div
          role="alert"
          aria-live="polite"
          className={`rounded-lg border px-4 py-3 text-sm ${
            msg.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        role="region"
        aria-labelledby="admin-registrations-title"
      >
        <table className="w-full text-sm">
          <caption className="sr-only">
            Ausstehende Registrierungsanträge mit Kennung und E-Mail
          </caption>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-700">
              <th scope="col" className="px-5 py-3">
                Kennung
              </th>
              <th scope="col" className="px-5 py-3">
                E-Mail
              </th>
              <th scope="col" className="px-5 py-3">
                Eingegangen
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                Aktion
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-slate-600"
                >
                  Wird geladen…
                </td>
              </tr>
            )}
            {!loading && pending.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-slate-600"
                >
                  Keine ausstehenden Anträge.
                </td>
              </tr>
            )}
            {pending.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3 font-medium text-slate-800">
                  {p.username}
                </td>
                <td className="px-5 py-3 text-slate-600">{p.email}</td>
                <td className="px-5 py-3 text-slate-600">
                  {new Date(p.createdAt).toLocaleString("de-CH")}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void approve(p.id)}
                      aria-label={`Antrag von ${p.username} genehmigen`}
                    >
                      Genehmigen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openReject(p)}
                      aria-label={`Antrag von ${p.username} ablehnen`}
                    >
                      Ablehnen
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Antrag ablehnen
              {rejectTarget ? ` (${rejectTarget.username})` : ""}
            </DialogTitle>
            <DialogDescription>
              Optional kann ein kurzer Ablehnungsgrund festgehalten werden. Der
              Text wird für den internen Nachvollzug verwendet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Ablehnungsgrund (optional)</Label>
            <Textarea
              id="reject-reason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={4000}
              aria-describedby={reasonFieldHintId}
              placeholder="z. B. Kennung entspricht nicht der Richtlinie"
              className="resize-y min-h-[80px]"
            />
            <p id={reasonFieldHintId} className="text-xs text-slate-600">
              Maximal 4000 Zeichen. Leer lassen, wenn kein Grund angegeben
              werden soll.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
            >
              Abbrechen
            </Button>
            <Button type="button" onClick={() => void confirmReject()}>
              Antrag ablehnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
