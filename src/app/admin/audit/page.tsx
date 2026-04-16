"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, ExternalLink, Filter } from "lucide-react";

type Row = {
  id: string;
  createdAt: string;
  category: string;
  action: string;
  username: string | null;
  details: string;
};

type Filters = {
  username: string;
  dateFrom: string;
  dateTo: string;
};

const emptyFilters = (): Filters => ({
  username: "",
  dateFrom: "",
  dateTo: "",
});

const categoryLabel: Record<string, string> = {
  NRT_RULE_CHANGE: "NRT-Regel",
  ACCOUNT: "Konto",
  AUTH: "Auth",
  RBAC: "RBAC",
  SYSTEM: "System",
};

const PAGE_SIZE = 25;

function buildListQuery(pageNum: number, f: Filters): string {
  const params = new URLSearchParams();
  params.set("page", String(pageNum));
  params.set("pageSize", String(PAGE_SIZE));
  const u = f.username.trim();
  if (u) params.set("username", u);
  if (f.dateFrom.trim()) params.set("dateFrom", f.dateFrom.trim());
  if (f.dateTo.trim()) params.set("dateTo", f.dateTo.trim());
  return params.toString();
}

export default function AdminAuditListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [draft, setDraft] = useState<Filters>(emptyFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setMsg(null);
    try {
      const qs = buildListQuery(page, applied);
      const res = await fetch(`/api/admin/audit/list?${qs}`);
      const data = (await res.json()) as {
        items?: Row[];
        total?: number;
        error?: string;
      };
      if (!res.ok) {
        setMsg({ text: data.error ?? `HTTP ${res.status}`, ok: false });
        return;
      }
      setRows(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setMsg({ text: "Netzwerkfehler.", ok: false });
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const applyFilters = () => {
    setApplied({
      username: draft.username,
      dateFrom: draft.dateFrom,
      dateTo: draft.dateTo,
    });
    setPage(1);
  };

  const resetFilters = () => {
    const e = emptyFilters();
    setDraft(e);
    setApplied(e);
    setPage(1);
  };

  const showPagination = total > 0 && (total > PAGE_SIZE || page > 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            id="audit-protocol-title"
            className="text-2xl font-semibold tracking-tight text-[#001D70]"
          >
            Audit-Protokoll
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Filter nach Benutzer (TAAxxxx) und Zeitraum; Detailansicht (IPA-213).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">Zur Übersicht</Link>
          </Button>
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
      </div>

      <div
        className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
        role="search"
        aria-labelledby="audit-filter-heading"
      >
        <h2
          id="audit-filter-heading"
          className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-800"
        >
          <Filter className="h-4 w-4 text-[#001D70]" aria-hidden />
          Filter
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="space-y-2 lg:col-span-3">
            <Label htmlFor="audit-user">Benutzer (TAAxxxx)</Label>
            <Input
              id="audit-user"
              name="username"
              autoComplete="username"
              placeholder="z. B. TAA0001"
              value={draft.username}
              onChange={(e) =>
                setDraft((d) => ({ ...d, username: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2 lg:col-span-3">
            <Label htmlFor="audit-from">Von</Label>
            <Input
              id="audit-from"
              type="date"
              value={draft.dateFrom}
              onChange={(e) =>
                setDraft((d) => ({ ...d, dateFrom: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2 lg:col-span-3">
            <Label htmlFor="audit-to">Bis</Label>
            <Input
              id="audit-to"
              type="date"
              value={draft.dateTo}
              onChange={(e) =>
                setDraft((d) => ({ ...d, dateTo: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:col-span-3">
            <Button
              type="button"
              onClick={applyFilters}
              disabled={loading}
              aria-describedby="audit-filter-heading"
            >
              Anwenden
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              disabled={loading}
            >
              Zurücksetzen
            </Button>
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            msg.ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          {msg.text}
        </div>
      )}

      <div
        className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm"
        role="region"
        aria-labelledby="audit-protocol-title"
      >
        <Table>
          <caption className="sr-only">
            Gefiltertes Audit-Protokoll mit Zeit, Benutzer, Kategorie und Aktion
          </caption>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-44">Zeit</TableHead>
              <TableHead>Benutzer</TableHead>
              <TableHead className="w-36">Kategorie</TableHead>
              <TableHead className="w-44">Aktion</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="w-28 text-right">Ansicht</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-slate-600"
                >
                  Wird geladen…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-slate-600"
                >
                  Keine Einträge für die aktuelle Filterkombination.
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
                    <Badge variant="secondary" className="font-normal">
                      {categoryLabel[r.category] ?? r.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.action}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-slate-600">
                    {r.details}
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

      {showPagination && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {total} Einträge, Seite {page} von {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={`Vorherige Seite, aktuell Seite ${page} von ${totalPages}`}
            >
              Zurück
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              aria-label={`Nächste Seite, aktuell Seite ${page} von ${totalPages}`}
            >
              Weiter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
