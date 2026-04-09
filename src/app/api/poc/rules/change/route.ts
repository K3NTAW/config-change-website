import { NextRequest, NextResponse } from 'next/server'
import { addAuditEntry, getSessionByToken } from '@/lib/poc-store'

const JIRA_REF_REGEX = /^IPA-\d{3,4}$/

function readToken(request: NextRequest): string | null {
  return request.headers.get('x-session-token')
}

export async function POST(request: NextRequest) {
  const session = getSessionByToken(readToken(request))

  if (!session) {
    return NextResponse.json({ success: false, message: 'Missing or invalid session.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const jiraRef = String(body?.jiraRef ?? '').trim().toUpperCase()
    const comment = String(body?.comment ?? '').trim()

    if (!JIRA_REF_REGEX.test(jiraRef)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Jira reference. Expected format: IPA-XXX.' },
        { status: 400 }
      )
    }

    if (comment.length < 5) {
      return NextResponse.json({ success: false, message: 'Comment must be at least 5 characters.' }, { status: 400 })
    }

    addAuditEntry({
      actor: session.userId,
      action: 'RULE_CHANGE',
      jiraRef,
      comment,
      details: 'PoC rule change request accepted.'
    })

    return NextResponse.json({
      success: true,
      message: 'PoC rule change accepted and audited.',
      jiraRef
    })
  } catch {
    return NextResponse.json({ success: false, message: 'Unexpected rule change PoC error.' }, { status: 500 })
  }
}
