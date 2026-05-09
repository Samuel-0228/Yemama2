'use client'

import Link from 'next/link'
import { useMode } from '@/components/mode-provider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export function AppNavbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { mode, loading, setMode } = useMode()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <div>
          <Link href="/dashboard" className="text-lg font-bold text-foreground">yemama</Link>
          <h1 className="text-xl font-bold text-foreground md:text-2xl">{title}</h1>
          {subtitle ? <p className="text-xs text-muted-foreground md:text-sm">{subtitle}</p> : null}
        </div>

        <div className="rounded-full border border-border bg-white px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className={mode === 'cycle' ? 'text-foreground' : 'text-muted-foreground'}>Cycle Mode</span>
            <Switch
              checked={mode === 'pregnancy'}
              disabled={loading}
              onCheckedChange={(checked) => {
                void setMode(checked ? 'pregnancy' : 'cycle')
              }}
            />
            <span className={mode === 'pregnancy' ? 'text-foreground' : 'text-muted-foreground'}>Pregnancy Mode</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export function ModeAwareCta() {
  const { mode, setMode } = useMode()

  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/auth/signup">
        <Button className="rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">Start Tracking</Button>
      </Link>
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => {
          void setMode(mode === 'cycle' ? 'pregnancy' : 'cycle')
        }}
      >
        Switch to {mode === 'cycle' ? 'Pregnancy' : 'Cycle'} Mode
      </Button>
    </div>
  )
}
