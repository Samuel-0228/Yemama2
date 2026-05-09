'use client'

import { useI18n, LANGUAGE_NAMES, Locale } from '@/lib/i18n'
import { Check, ChevronDown, Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const LANGUAGE_NATIVE_LABELS: Record<Locale, string> = {
  en: 'English',
  am: 'Amharic (አማርኛ)',
  or: 'Oromo (Afaan Oromoo)',
  ti: 'Tigrinya (ትግርኛ)',
}

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Select language"
        >
          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{compact ? locale.toUpperCase() : LANGUAGE_NAMES[locale]}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-2xl border-border/70 p-2 shadow-xl"
      >
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => setLocale(value as Locale)}>
          {(Object.keys(LANGUAGE_NAMES) as Locale[]).map((l) => (
            <DropdownMenuRadioItem
              key={l}
              value={l}
              className={cn(
                'group relative min-h-11 cursor-pointer rounded-xl px-3 py-2 transition-all',
                'data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary'
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{LANGUAGE_NATIVE_LABELS[l]}</p>
                  <p className="truncate text-xs text-muted-foreground">{l.toUpperCase()} • {LANGUAGE_NAMES[l]}</p>
                </div>
                <Check className="h-4 w-4 opacity-0 transition-opacity group-data-[state=checked]:opacity-100" />
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
