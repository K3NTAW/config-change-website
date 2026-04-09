import { NextRequest, NextResponse } from 'next/server'
import { getSessionByToken, listAuditEntries } from '@/lib/poc-store'

function readToken(request: NextRequest): string | null {
  return request.headers.get('x-session-token')
}

export async function GET(request: NextRequest) {
  const session = getSessionByToken(readToken(request))
  if (!session) {
    return NextResponse.json({ success: false, message: 'Missing or invalid session.' }, { status: 401 })
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, message: 'Forbidden: only ADMIN users can access audit logs.' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const actor = searchParams.get('actor') ?? undefined
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  const items = listAuditEntries({ actor, from, to })
  return NextResponse.json({
    success: true,
    count: items.length,
    items
  })
}
