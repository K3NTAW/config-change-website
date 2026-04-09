'use client'

import { useMemo, useState } from 'react'

type Role = 'ADMIN' | 'BASIC'

type AuditEntry = {
  id: number
  timestamp: string
  actor: string
  action: string
  jiraRef?: string
  comment?: string
  details: string
}

export default function PocPage() {
  const [userId, setUserId] = useState('TAA1001')
  const [password, setPassword] = useState('Admin!1234')
  const [token, setToken] = useState('')
  const [role, setRole] = useState<Role | null>(null)
  const [jiraRef, setJiraRef] = useState('IPA-201')
  const [comment, setComment] = useState('Update mapping for PoC demo')
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [message, setMessage] = useState('Ready for PoC demo.')

  const canRunActions = useMemo(() => token.length > 0, [token])
  const canViewAudit = useMemo(() => canRunActions && role === 'ADMIN', [canRunActions, role])

  async function login() {
    const res = await fetch('/api/poc/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password })
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(`Login failed: ${data.message}`)
      return
    }
    setToken(data.token)
    setRole(data.user.role as Role)
    setMessage(`Login successful as ${data.user.userId} (${data.user.role}).`)
  }

  async function checkAdminEndpoint() {
    const res = await fetch('/api/poc/admin/ping', {
      headers: { 'x-session-token': token }
    })
    const data = await res.json()
    setMessage(`${res.status}: ${data.message}`)
  }

  async function submitRuleChange() {
    const res = await fetch('/api/poc/rules/change', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': token
      },
      body: JSON.stringify({ jiraRef, comment })
    })
    const data = await res.json()
    setMessage(`${res.status}: ${data.message}`)
  }

  async function loadAudit() {
    if (role !== 'ADMIN') {
      setMessage('403: Audit log is only accessible for ADMIN users.')
      return
    }
    const qs = new URLSearchParams()
    if (userId) {
      qs.set('actor', userId)
    }
    const res = await fetch(`/api/poc/audit?${qs.toString()}`, {
      headers: { 'x-session-token': token }
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(`${res.status}: ${data.message}`)
      return
    }
    setAudit(data.items)
    setMessage(`Loaded ${data.count} audit entries.`)
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold text-[#001D70]">PoC: Auth + RBAC + Audit</h1>
        <p className="text-sm text-slate-600">
          Demo-only spike. Uses in-memory sessions and audit records to validate behavior before full IPA implementation.
        </p>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">1) Login</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="rounded border p-2" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="TAAxxxx" />
            <input className="rounded border p-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            <button className="rounded bg-[#0055FF] px-3 py-2 font-medium text-white" onClick={login}>Login</button>
          </div>
          <p className="mt-2 text-sm">Session: {token ? 'created' : 'none'} | Role: {role ?? '-'}</p>
          <p className="mt-1 text-xs text-slate-500">Test users: TAA1001/Admin!1234, TAA2001/Basic!1234</p>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">2) RBAC & Rule Change</h2>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded bg-slate-900 px-3 py-2 font-medium text-white disabled:opacity-40"
              onClick={checkAdminEndpoint}
              disabled={!canRunActions}
            >
              Check Admin Endpoint
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input className="rounded border p-2" value={jiraRef} onChange={(e) => setJiraRef(e.target.value)} placeholder="IPA-201" />
            <input className="rounded border p-2 md:col-span-2" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comment" />
          </div>
          <button
            className="mt-3 rounded bg-emerald-600 px-3 py-2 font-medium text-white disabled:opacity-40"
            onClick={submitRuleChange}
            disabled={!canRunActions}
          >
            Submit Rule Change
          </button>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">3) Audit Log</h2>
          <button className="rounded bg-purple-700 px-3 py-2 font-medium text-white disabled:opacity-40" onClick={loadAudit} disabled={!canViewAudit}>
            Load Audit (filtered by current user field)
          </button>
          <p className="mt-2 text-xs text-slate-500">Access policy: only ADMIN can view audit entries.</p>
          <div className="mt-4 overflow-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border p-2 text-left">Time</th>
                  <th className="border p-2 text-left">Actor</th>
                  <th className="border p-2 text-left">Action</th>
                  <th className="border p-2 text-left">Jira</th>
                  <th className="border p-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border p-2">{entry.timestamp}</td>
                    <td className="border p-2">{entry.actor}</td>
                    <td className="border p-2">{entry.action}</td>
                    <td className="border p-2">{entry.jiraRef ?? '-'}</td>
                    <td className="border p-2">{entry.details}</td>
                  </tr>
                ))}
                {audit.length === 0 ? (
                  <tr>
                    <td className="border p-2 text-slate-500" colSpan={5}>No entries loaded yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">{message}</div>
      </div>
    </main>
  )
}
