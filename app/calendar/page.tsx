'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfMonth } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { AppBottomNav } from '@/components/app-bottom-nav'
import { AppNavbar } from '@/components/app-navbar'
import { useMode } from '@/components/mode-provider'
import { Card } from '@/components/ui/card'

type CycleRow = {
  id: string
  date: string
  is_period?: boolean
  is_fertile?: boolean
  is_ovulation?: boolean
}

type PregnancyLogRow = {
  id: string
  date: string
  current_week: number
  appointment_date: string | null
  tip: string | null
}

export default function CalendarPage() {
  const supabase = createClient()
  const { mode, userId } = useMode()
  const [cycles, setCycles] = useState<CycleRow[]>([])
  const [pregnancyLogs, setPregnancyLogs] = useState<PregnancyLogRow[]>([])
  const [loading, setLoading] = useState(true)

  const date = new Date()
  const monthStart = startOfMonth(date)
  const days = new Array(35).fill(null).map((_, index) => addDays(monthStart, index))

  useEffect(() => {
    const run = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      setLoading(true)

      const cycleResult = await supabase
        .from('cycles')
        .select('id,date,is_period,is_fertile,is_ovulation')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(180)

      const pregnancyResult = await supabase
        .from('pregnancy_logs')
        .select('id,date,current_week,appointment_date,tip')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(100)

      setCycles((cycleResult.data ?? []) as CycleRow[])
      setPregnancyLogs((pregnancyResult.data ?? []) as PregnancyLogRow[])
      setLoading(false)
    }

    void run()
  }, [supabase, userId, mode])

  const cycleMap = useMemo(() => new Map(cycles.map((entry) => [entry.date, entry])), [cycles])
  const appointmentList = useMemo(() => pregnancyLogs.filter((entry) => entry.appointment_date), [pregnancyLogs])

  const classForDay = (entry: CycleRow | undefined) => {
    if (!entry) return 'bg-gray-50 text-foreground'
    if (entry.is_period) return 'bg-pink-300 text-white'
    if (entry.is_ovulation) return 'bg-purple-400 text-white'
    if (entry.is_fertile) return 'bg-blue-300 text-white'
    return 'bg-gray-50 text-foreground'
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppNavbar
        title={mode === 'cycle' ? 'Cycle Calendar' : 'Pregnancy Calendar'}
        subtitle={mode === 'cycle' ? 'Color-coded period, fertility, and ovulation days' : 'Appointments, milestones, and weekly pregnancy timeline'}
      />

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
        {loading ? (
          <Card className="border-0 p-6 text-sm text-muted-foreground">Loading calendar...</Card>
        ) : (
          <Card className="border-0 p-4">
            <p className="mb-3 text-sm text-muted-foreground">{format(date, 'MMMM yyyy')}</p>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => <div key={label}>{label}</div>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {days.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd')
                const entry = cycleMap.get(dayKey)

                return (
                  <div key={dayKey} className={`flex aspect-square items-center justify-center rounded-xl text-sm ${mode === 'cycle' ? classForDay(entry) : 'bg-blue-50 text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {mode === 'cycle' ? (
          <Card className="border-0 p-4 text-sm text-muted-foreground">
            <p>Period prediction and ovulation tracking are active in Cycle Mode.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-pink-100 px-2 py-1">Period</span>
              <span className="rounded-full bg-blue-100 px-2 py-1">Fertile</span>
              <span className="rounded-full bg-purple-100 px-2 py-1">Ovulation</span>
            </div>
          </Card>
        ) : (
          <Card className="border-0 p-4">
            <h3 className="mb-3 font-semibold">Upcoming Appointments</h3>
            {appointmentList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reminders yet. Add your next checkup in the dashboard.</p>
            ) : (
              <ul className="space-y-2">
                {appointmentList.slice(0, 5).map((entry) => (
                  <li key={entry.id} className="rounded-xl bg-blue-50 p-3 text-sm">
                    <p className="font-medium">{format(new Date(entry.appointment_date as string), 'EEE, MMM d')}</p>
                    <p className="text-muted-foreground">Week {entry.current_week} • {entry.tip ?? 'Routine checkup'}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Period prediction and ovulation tracking are disabled in Pregnancy Mode.</p>
          </Card>
        )}
      </main>

      <AppBottomNav />
    </div>
  )
}
