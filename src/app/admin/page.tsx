"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, LayoutDashboard, ExternalLink } from "lucide-react";

type Row = {
  id: string;
  createdAt: string;
  category: string;
  action: string;
  username: string | null;
  details: string;
};

const categoryLabel: Record<string, string> = {
  NRT_RULE_CHANGE: "NRT-Regel",
  ACCOUNT: "Konto",
  AUTH: "Auth",
  RBAC: "RBAC",
  SYSTEM: "System",
};

export default function AdminDashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/audit/summary?limit=20");
      const data = (await res.json()) as { items?: Row[]; error?: string };
      if (!res.ok) {
        setMsg({ text: data.error ?? `HTTP ${res.status}`, ok: false });
        return;
      }
      setRows(data.items ?? []);
    } catch {
      setMsg({ text: "Netzwerkfehler beim Laden.", ok: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F0F4FF] text-[#0055FF]">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <div>
            <h1
              id="admin-dashboard-title"
              className="text-2xl font-semibold tracking-tight text-[#001D70]"
            >
              Admin-Dashboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Die letzten Audit-Einträge auf einen Blick — Zeit, Benutzer, Aktion
              und Details (IPA-212).
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
          />
          Aktualisieren
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="text-slate-600">Weitere Admin-Bereiche:</span>
        <Link
          href="/admin/users"
          className="font-medium text-[#0055FF] hover:underline"
        >
          Benutzer
        </Link>
        <span className="text-slate-300">|</span>
        <Link
          href="/admin/registrations"
          className="font-medium text-[#0055FF] hover:underline"
        >
          Registrierungen
        </Link>
        <span className="text-slate-300">|</span>
        <Link
          href="/admin/rule-changes"
          className="font-medium text-[#0055FF] hover:underline"
        >
          Regeländerungen
        </Link>
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
        className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
        role="region"
        aria-labelledby="admin-dashboard-title"
      >
        <Table>
          <caption className="sr-only">
            Letzte Audit-Einträge, sortiert nach Zeit
          </caption>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-44">Zeit</TableHead>
              <TableHead className="w-44">Benutzer</TableHead>
              <TableHead className="w-36">Kategorie</TableHead>
              <TableHead className="w-48">Aktion</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-28 text-right">Ansicht</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-600">
                  Wird geladen…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-slate-600">
                  Keine Audit-Einträge vorhanden.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-sm text-slate-600">
                    {new Date(r.createdAt).toLocaleString("de-CH")}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800">
                    {r.username ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="font-normal text-slate-700"
                    >
                      {categoryLabel[r.category] ?? r.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">
                    {r.action}
                  </TableCell>
                  <TableCell className="max-w-md text-sm text-slate-600">
                    <span className="line-clamp-3" title={r.details}>
                      {r.details}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/audit/${r.id}`}>
                        <ExternalLink className="mr-1 h-3.5 w-3.5" />
                        Detail
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-center text-xs text-slate-600">
        Anzeige der letzten 20 Einträge, sortiert nach Zeit (neueste zuerst).
      </p>
    </div>
  );
}
