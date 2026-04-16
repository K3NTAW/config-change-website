"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, FileJson } from "lucide-react";
import {
  extractDiffFromPayload,
  extractJiraRefFromPayload,
} from "@/lib/admin/audit-detail-format";

type Detail = {
  id: string;
  createdAt: string;
  category: string;
  action: string;
  resource: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
  username: string | null;
  userEmail: string | null;
  payload: Record<string, unknown> | null;
};

const categoryLabel: Record<string, string> = {
  NRT_RULE_CHANGE: "NRT-Regel",
  ACCOUNT: "Konto",
  AUTH: "Auth",
  RBAC: "RBAC",
  SYSTEM: "System",
};

export default function AdminAuditDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit/${id}`);
      const data = (await res.json()) as { detail?: Detail; error?: string };
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        setDetail(null);
        return;
      }
      setDetail(data.detail ?? null);
    } catch {
      setError("Netzwerkfehler.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const diffText = detail?.payload
    ? extractDiffFromPayload(detail.payload)
    : null;
  const jiraRef = detail?.payload
    ? extractJiraRefFromPayload(detail.payload)
    : null;

  let payloadForJson = detail?.payload ?? null;
  if (payloadForJson && diffText) {
    payloadForJson = { ...payloadForJson };
    delete (payloadForJson as Record<string, unknown>).diff;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Übersicht
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/audit">Protokoll</Link>
        </Button>
      </div>

      <div>
        <h1
          id="audit-detail-title"
          className="text-2xl font-semibold tracking-tight text-[#001D70]"
        >
          Audit-Eintrag (Detail)
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Vollständige Felder inkl. Payload und Diff — IPA-213
        </p>
      </div>

      {loading && (
        <p className="text-slate-600" role="status" aria-live="polite">
          Wird geladen…
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {!loading && detail && (
        <div className="space-y-6" role="region" aria-labelledby="audit-detail-title">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {categoryLabel[detail.category] ?? detail.category}
            </Badge>
            <span className="font-mono text-sm text-slate-600">{detail.action}</span>
          </div>

          <dl className="grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Zeitstempel
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {new Date(detail.createdAt).toLocaleString("de-CH", {
                  dateStyle: "medium",
                  timeStyle: "medium",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">
                userId
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-slate-900">
                {detail.userId ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Benutzer
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {detail.username ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">
                E-Mail
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {detail.userEmail ?? "—"}
              </dd>
            </div>
            {jiraRef && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">
                  Jira-Referenz
                </dt>
                <dd className="mt-1 font-mono text-sm text-slate-900">{jiraRef}</dd>
              </div>
            )}
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Resource
              </dt>
              <dd className="mt-1 break-all font-mono text-sm text-slate-900">
                {detail.resource ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">
                IP-Adresse
              </dt>
              <dd className="mt-1 font-mono text-sm text-slate-700">
                {detail.ipAddress ?? "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-600">
                User-Agent
              </dt>
              <dd className="mt-1 break-all text-xs text-slate-600">
                {detail.userAgent ?? "—"}
              </dd>
            </div>
          </dl>

          {diffText && (
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-[#001D70]">
                Diff
              </h2>
              <ScrollArea className="max-h-[min(70vh,560px)] rounded-lg border border-slate-200 bg-slate-950">
                <pre className="p-4 font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre-wrap break-all">
                  {diffText}
                </pre>
              </ScrollArea>
            </div>
          )}

          <div className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[#001D70]">
              <FileJson className="h-4 w-4" />
              Payload (JSON)
              {diffText && (
                <span className="font-normal text-slate-600">
                  (ohne Diff-Feld — siehe oben)
                </span>
              )}
            </h2>
            <ScrollArea className="max-h-[min(50vh,400px)] rounded-lg border border-slate-200 bg-slate-50">
              <pre className="p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap break-all">
                {payloadForJson && Object.keys(payloadForJson).length > 0
                  ? JSON.stringify(payloadForJson, null, 2)
                  : "{}"}
              </pre>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}
