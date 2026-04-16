"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

type Row = {
  id: string;
  createdAt: string;
  resource: string | null;
  username: string | null;
  payload: Record<string, unknown> | null;
};

export default function AdminRuleChangesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [selectedPayload, setSelectedPayload] = useState<Record<
    string,
    unknown
  > | null>(null);

  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/audit/rule-changes?page=${page}&pageSize=${pageSize}`,
      );
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
      setMsg({ text: "Netzwerkfehler beim Laden.", ok: false });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  function openDiff(payload: Record<string, unknown> | null) {
    setSelectedPayload(payload);
    setDiffOpen(true);
  }

  const diffText =
    selectedPayload && typeof selectedPayload.diff === "string"
      ? selectedPayload.diff
      : "";
  const diffStat =
    selectedPayload && typeof selectedPayload.diffStat === "string"
      ? selectedPayload.diffStat
      : "";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            id="admin-rule-changes-title"
            className="text-2xl font-semibold tracking-tight text-[#001D70]"
          >
            Regeländerungen (Audit)
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Wer hat wann welche Datei mit welchem Jira-Bezug geändert — inkl.
            Diff und Kommentar (IPA-211).
          </p>
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
        aria-labelledby="admin-rule-changes-title"
      >
        <Table>
          <caption className="sr-only">
            NRT-Regeländerungen mit Zeit, Benutzer, Jira und Datei
          </caption>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-44">Zeit</TableHead>
              <TableHead>Benutzer</TableHead>
              <TableHead>Jira</TableHead>
              <TableHead>Datei</TableHead>
              <TableHead>Release / Env</TableHead>
              <TableHead className="text-right">Aktion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-600">
                  Wird geladen…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-slate-600">
                  Keine Einträge.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => {
                const p = r.payload ?? {};
                const jira =
                  typeof p.jiraRef === "string" ? p.jiraRef : "—";
                const rel =
                  typeof p.release === "string" ? p.release : "";
                const env =
                  typeof p.environment === "string" ? p.environment : "";
                const comment =
                  typeof p.comment === "string" && p.comment
                    ? p.comment
                    : null;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap text-sm text-slate-600">
                      {new Date(r.createdAt).toLocaleString("de-CH")}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {r.username ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{jira}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm text-slate-600">
                      {r.resource ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {rel && env ? `${rel} / ${env}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDiff(r.payload)}
                        aria-label={`Diff anzeigen für ${r.resource ?? "Eintrag"} vom ${new Date(r.createdAt).toLocaleString("de-CH")}`}
                      >
                        Diff
                      </Button>
                      {comment && (
                        <p
                          className="mt-1 max-w-[140px] truncate text-xs text-slate-600"
                          title={comment}
                        >
                          {comment}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {total} Einträge, Seite {page} von {Math.ceil(total / pageSize) || 1}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label={`Vorherige Seite Regeländerungen, Seite ${page}`}
            >
              Zurück
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= total || loading}
              onClick={() => setPage((p) => p + 1)}
              aria-label={`Nächste Seite Regeländerungen, Seite ${page}`}
            >
              Weiter
            </Button>
          </div>
        </div>
      )}

      <Dialog open={diffOpen} onOpenChange={setDiffOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl gap-0 p-0">
          <DialogHeader className="border-b border-slate-100 px-6 py-4">
            <DialogTitle className="text-[#001D70]">Diff & Metadaten</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-6 py-4">
            {selectedPayload && (
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                {typeof selectedPayload.jiraRef === "string" && (
                  <div>
                    <dt className="text-slate-600">Jira</dt>
                    <dd className="font-medium">{selectedPayload.jiraRef}</dd>
                  </div>
                )}
                {typeof selectedPayload.commitSha === "string" && (
                  <div>
                    <dt className="text-slate-600">Commit</dt>
                    <dd className="break-all font-mono text-xs">
                      {selectedPayload.commitSha}
                    </dd>
                  </div>
                )}
                {typeof selectedPayload.comment === "string" &&
                  selectedPayload.comment && (
                    <div className="sm:col-span-2">
                      <dt className="text-slate-600">Kommentar</dt>
                      <dd>{selectedPayload.comment}</dd>
                    </div>
                  )}
              </dl>
            )}
            {diffStat ? (
              <div className="rounded-lg bg-slate-100 p-3 font-mono text-xs text-slate-700">
                <pre className="whitespace-pre-wrap">{diffStat}</pre>
              </div>
            ) : null}
            <ScrollArea className="h-[min(60vh,480px)] rounded-lg border border-slate-200 bg-slate-950">
              <pre className="p-4 font-mono text-xs leading-relaxed text-emerald-300">
                {diffText || "(Kein Diff-Text)"}
              </pre>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
