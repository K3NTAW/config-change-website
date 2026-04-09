'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="group flex items-center space-x-2">
            <span className="text-xl font-semibold tracking-tighter text-[#001D70] transition-colors group-hover:text-[#0055FF]">
              NRT-Automation
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]">
              Home
            </Link>
            <Link href="/nrt-ruleset" className="text-sm font-medium text-slate-600 transition-colors hover:text-[#0055FF]">
              NRT Ruleset
            </Link>
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-600 hover:text-[#0055FF] md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
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
          </nav>
        </div>
      )}
    </header>
  )
}