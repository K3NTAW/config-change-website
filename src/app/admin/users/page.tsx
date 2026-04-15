"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, ShieldOff, UserCog, UserX, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type User = {
  id: string;
  username: string;
  email: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  role: { id: string; name: string };
};

const ROLES = ["ADMIN", "BASIC"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const toast = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        toast("Fehler beim Laden der Benutzer.", false);
        return;
      }
      const data = (await res.json()) as { users: User[] };
      setUsers(data.users);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function changeRole(userId: string, newRole: string) {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast(data.error ?? `HTTP ${res.status}`, false);
      return;
    }
    toast(`Rolle auf ${newRole} geändert.`);
    await loadUsers();
  }

  async function deactivate(userId: string, username: string) {
    if (!confirm(`Benutzer «${username}» wirklich deaktivieren?`)) return;
    const res = await fetch(`/api/admin/users/${userId}/deactivate`, { method: "POST" });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      toast(data.error ?? `HTTP ${res.status}`, false);
      return;
    }
    toast(`«${username}» deaktiviert.`);
    await loadUsers();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#001D70]">
            Benutzerverwaltung
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Rollen zuweisen, Benutzer deaktivieren — nur für Administratoren.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

      {}
      {msg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            msg.ok
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      {}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3">Benutzer</th>
              <th className="px-5 py-3">E-Mail</th>
              <th className="px-5 py-3">Rolle</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  Wird geladen…
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  Keine Benutzer gefunden.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className={`transition-colors hover:bg-slate-50 ${!u.isActive ? "opacity-50" : ""}`}>
                <td className="px-5 py-3 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 shrink-0 text-slate-400" />
                    {u.username}
                    {u.mustChangePassword && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        PW ändern
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-500">{u.email ?? "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      u.role.name === "ADMIN"
                        ? "bg-[#F0F4FF] text-[#0055FF]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {u.role.name === "ADMIN" ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <ShieldOff className="h-3 w-3" />
                    )}
                    {u.role.name}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      u.isActive
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-green-500" : "bg-slate-400"}`} />
                    {u.isActive ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex gap-2">
                    {}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs">
                          Rolle <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ROLES.map((r) => (
                          <DropdownMenuItem
                            key={r}
                            disabled={u.role.name === r}
                            onClick={() => void changeRole(u.id, r)}
                          >
                            {r}
                            {u.role.name === r && " ✓"}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!u.isActive}
                      onClick={() => void deactivate(u.id, u.username)}
                      className="h-7 gap-1 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 disabled:text-slate-300"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Deaktivieren
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        Alle Änderungen werden im Audit-Log festgehalten. Deaktivierte Benutzer können sich nicht mehr anmelden.
      </p>
    </div>
  );
}
