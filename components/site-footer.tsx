'use client'

import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Mail, MapPin, ShieldCheck, FileText } from 'lucide-react'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-10 border-t border-border/60 bg-white/80 pb-24 pt-10 backdrop-blur-sm">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 md:grid-cols-4">
        <div className="space-y-3">
          <p className="text-lg font-semibold">Yemama</p>
          <p className="text-sm text-muted-foreground">
            Trusted health tracking for pregnancy and period care with clear guidance and privacy-first design.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="transition-colors hover:text-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="transition-colors hover:text-foreground">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="transition-colors hover:text-foreground">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Product</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link className="transition-colors hover:text-foreground" href="/dashboard">Dashboard</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/health-metrics">Health Metrics</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/doctor">Doctor and Lab Finder</Link></li>
            <li><Link className="transition-colors hover:text-foreground" href="/calendar">Appointments</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Legal</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="inline-flex items-center gap-2 transition-colors hover:text-foreground" href="/privacy">
                <ShieldCheck className="h-4 w-4" /> Privacy Policy
              </Link>
            </li>
            <li>
              <Link className="inline-flex items-center gap-2 transition-colors hover:text-foreground" href="/terms">
                <FileText className="h-4 w-4" /> Terms of Use
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold">Contact</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> support@yemama.app</li>
            <li className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> Addis Ababa, Ethiopia</li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-6xl flex-col gap-2 border-t border-border/60 px-4 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} Yemama. All rights reserved.</p>
        <p>Health guidance only. Not a substitute for professional medical care.</p>
      </div>
    </footer>
  )
}
