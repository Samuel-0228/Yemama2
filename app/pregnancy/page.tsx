'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AppBottomNav } from '@/components/app-bottom-nav'
import { AppNavbar } from '@/components/app-navbar'
import { useMode } from '@/components/mode-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type PregnancyLogRow = {
  id: string
  current_week: number
  baby_size: string | null
  tip: string | null
}

export default function PregnancyPage() {
  const supabase = createClient()
  const { mode, userId } = useMode()
  const [log, setLog] = useState<PregnancyLogRow | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!userId) return
      const { data } = await supabase
        .from('pregnancy_logs')
        .select('id,current_week,baby_size,tip')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()

      setLog((data ?? null) as PregnancyLogRow | null)
    }

    void run()
  }, [supabase, userId])

  if (mode !== 'pregnancy') {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppNavbar title="Pregnancy View" subtitle="Switch to Pregnancy Mode to unlock this section" />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <Card className="border-0 p-6 text-center">
            <p className="text-sm text-muted-foreground">You are currently in Cycle Mode.</p>
            <Link href="/dashboard"><Button className="mt-4">Back to Dashboard</Button></Link>
          </Card>
        </main>
        <AppBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppNavbar title="Pregnancy Tracker" subtitle="Weekly development and daily care" />
      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 md:grid-cols-3">
        <Card className="border-0 p-5 md:col-span-2">
          <h2 className="text-xl font-bold">Week {log?.current_week ?? 20}</h2>
          <p className="mt-2 text-sm text-muted-foreground">Baby size this week: {log?.baby_size ?? 'Banana'}</p>
          <p className="mt-3 rounded-xl bg-purple-50 p-3 text-sm">{log?.tip ?? 'Stay active with gentle movement, hydrate, and track rest daily.'}</p>
        </Card>
        <Card className="border-0 p-5">
          <h3 className="font-semibold">Daily Tips</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Take prenatal vitamins consistently.</li>
            <li>• Track any new symptoms.</li>
            <li>• Plan your next appointment reminder.</li>
          </ul>
        </Card>
      </main>
      <AppBottomNav />
    </div>
  )
}
