import { NextRequest, NextResponse } from 'next/server'
import { addAuditEntry, createPocSession, getPocUser } from '@/lib/poc-store'

const USER_ID_REGEX = /^TAA\d{4}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = String(body?.userId ?? '').trim().toUpperCase()
    const password = String(body?.password ?? '')

    if (!USER_ID_REGEX.test(userId) || password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials format for PoC.' },
        { status: 400 }
      )
    }

    const user = getPocUser(userId, password)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Authentication failed.' }, { status: 401 })
    }

    const session = createPocSession(user.userId, user.role)
    addAuditEntry({
      actor: user.userId,
      action: 'LOGIN_SUCCESS',
      details: `Successful PoC login as ${user.role}`
    })

    return NextResponse.json({
      success: true,
      token: session.token,
      user: { userId: session.userId, role: session.role }
    })
  } catch {
    return NextResponse.json({ success: false, message: 'Unexpected PoC login error.' }, { status: 500 })
  }
}
