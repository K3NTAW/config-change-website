'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { ROLES } from '@/lib/auth/rbac'

type SessionInfo = { authenticated: true; role: string } | { authenticated: false }

export function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [session, setSession] = useState<SessionInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/session')
      .then((res) => res.json() as Promise<{ authenticated?: boolean; role?: string }>)
      .then((data) => {
        if (cancelled) return
        if (data.authenticated && typeof data.role === 'string') {
          setSession({ authenticated: true, role: data.role })
        } else {
          setSession({ authenticated: false })
        }
      })
      .catch(() => {
        if (!cancelled) setSession({ authenticated: false })
      })
    return () => {
      cancelled = true
    }
  }, [pathname])

  const isAdmin = session?.authenticated === true && session.role === ROLES.ADMIN

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {}
        <div className="flex items-center space-x-8">
          <Link href="/" className="group flex items-center space-x-2">
            <span className="text-xl font-semibold tracking-tighter text-[#001D70] transition-colors group-hover:text-[#0055FF]">
              NRT-Automation
            </span>
          </Link>
          
          {}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]">
              Home
            </Link>
            <Link href="/nrt-ruleset" className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]">
              NRT Ruleset
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/admin/users"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]"
                >
                  Benutzer
                </Link>
                <Link
                  href="/admin/registrations"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]"
                >
                  Registrierungen
                </Link>
              </>
            )}
          </nav>
        </div>

        {}
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600 hover:text-[#0055FF] md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {}
      {isMobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <nav className="container py-4 space-y-2">
            <Link
              href="/"
              className="block px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/nrt-ruleset"
              className="block px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              NRT Ruleset
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/admin/users"
                  className="block px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Benutzer
                </Link>
                <Link
                  href="/admin/registrations"
                  className="block px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Registrierungen
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
