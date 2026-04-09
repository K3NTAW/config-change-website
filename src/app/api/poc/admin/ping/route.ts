import { NextRequest, NextResponse } from 'next/server'
import { addAuditEntry, getSessionByToken } from '@/lib/poc-store'

function readToken(request: NextRequest): string | null {
  return request.headers.get('x-session-token')
}

export async function GET(request: NextRequest) {
  const session = getSessionByToken(readToken(request))

  if (!session) {
    return NextResponse.json({ success: false, message: 'Missing or invalid session.' }, { status: 401 })
  }

  if (session.role !== 'ADMIN') {
    addAuditEntry({
      actor: session.userId,
      action: 'ACCESS_DENIED',
      details: 'Denied access to ADMIN PoC endpoint.'
    })
    return NextResponse.json({ success: false, message: 'Forbidden: admin role required.' }, { status: 403 })
  }

  return NextResponse.json({
    success: true,
    message: 'Admin endpoint access granted in PoC.',
    actor: session.userId
  })
}
