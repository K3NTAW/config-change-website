export type PocRole = 'ADMIN' | 'BASIC'

export type PocSession = {
  token: string
  userId: string
  role: PocRole
  createdAt: string
}

export type PocAuditEntry = {
  id: number
  timestamp: string
  actor: string
  action: 'LOGIN_SUCCESS' | 'ACCESS_DENIED' | 'RULE_CHANGE'
  jiraRef?: string
  comment?: string
  details: string
}

type PocUser = {
  userId: string
  password: string
  role: PocRole
}

const users: PocUser[] = [
  { userId: 'TAA1001', password: 'Admin!1234', role: 'ADMIN' },
  { userId: 'TAA2001', password: 'Basic!1234', role: 'BASIC' }
]

const sessions = new Map<string, PocSession>()
const audit: PocAuditEntry[] = []
let nextAuditId = 1

function nowIso(): string {
  return new Date().toISOString()
}

function createToken(): string {
  return `poc_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

export function getPocUser(userId: string, password: string): PocUser | undefined {
  return users.find((u) => u.userId === userId && u.password === password)
}

export function createPocSession(userId: string, role: PocRole): PocSession {
  const session: PocSession = {
    token: createToken(),
    userId,
    role,
    createdAt: nowIso()
  }
  sessions.set(session.token, session)
  return session
}

export function getSessionByToken(token: string | null): PocSession | null {
  if (!token) {
    return null
  }
  return sessions.get(token) ?? null
}

export function addAuditEntry(entry: Omit<PocAuditEntry, 'id' | 'timestamp'>): PocAuditEntry {
  const newEntry: PocAuditEntry = {
    id: nextAuditId++,
    timestamp: nowIso(),
    ...entry
  }
  audit.unshift(newEntry)
  return newEntry
}

export function listAuditEntries(filters?: { actor?: string; from?: string; to?: string }): PocAuditEntry[] {
  const from = filters?.from ? new Date(filters.from).getTime() : Number.NEGATIVE_INFINITY
  const to = filters?.to ? new Date(filters.to).getTime() : Number.POSITIVE_INFINITY

  return audit.filter((entry) => {
    const ts = new Date(entry.timestamp).getTime()
    const actorMatch = filters?.actor ? entry.actor === filters.actor : true
    return actorMatch && ts >= from && ts <= to
  })
}
