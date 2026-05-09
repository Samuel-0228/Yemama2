'use client'

import { useI18n, LANGUAGE_NAMES, Locale } from '@/lib/i18n'
import { ChevronDown, Globe } from 'lucide-react'

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n()

  return (
    <div className="relative inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="appearance-none bg-transparent text-sm font-medium text-foreground cursor-pointer pr-5 focus:outline-none"
        aria-label="Select language"
      >
        {(Object.keys(LANGUAGE_NAMES) as Locale[]).map((l) => (
          <option key={l} value={l}>
            {compact ? l.toUpperCase() : LANGUAGE_NAMES[l]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
    </div>
  )
}
