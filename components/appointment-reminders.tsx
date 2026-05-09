'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

type Appointment = {
  id: string
  title: string
  scheduled_at: string
  reminder_minutes: number | null
}

function remindedKey(id: string) {
  return `yemama-reminded:${id}`
}

export function AppointmentReminders() {
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const now = new Date()
        const soon = new Date(now)
        soon.setHours(soon.getHours() + 24)

        const { data, error } = await supabase
          .from('appointments')
          .select('id,title,scheduled_at,reminder_minutes')
          .eq('user_id', user.id)
          .gte('scheduled_at', now.toISOString())
          .lte('scheduled_at', soon.toISOString())
          .order('scheduled_at', { ascending: true })
          .limit(20)

        if (error || cancelled) return

        ;(data as Appointment[] | null | undefined)?.forEach((a) => {
          const reminder = a.reminder_minutes ?? 30
          const when = new Date(a.scheduled_at)
          const msUntil = when.getTime() - Date.now()
          const shouldNotify = msUntil <= reminder * 60_000 && msUntil >= 0

          if (!shouldNotify) return
          if (typeof window === 'undefined') return
          if (localStorage.getItem(remindedKey(a.id))) return

          localStorage.setItem(remindedKey(a.id), String(Date.now()))
          toast({
            title: 'Appointment reminder',
            description: `${a.title} • ${when.toLocaleString()}`,
          })
        })
      } catch {
        // ignore
      }
    }

    check()
    const id = window.setInterval(check, 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  return null
}

