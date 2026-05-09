'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { addDays, differenceInCalendarDays, format } from 'date-fns'
import { Baby, CalendarDays, Flower2, HeartPulse, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AppBottomNav } from '@/components/app-bottom-nav'
import { AppNavbar } from '@/components/app-navbar'
import { InsightsCharts } from '@/components/insights-charts'
import { useMode } from '@/components/mode-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type CycleRow = {
  id: string
  date: string
  is_period?: boolean
  is_fertile?: boolean
  is_ovulation?: boolean
}

type SymptomRow = {
  id: string
  symptom_name: string
  notes: string | null
  intensity: number
  date: string
}

type PregnancyLogRow = {
  id: string
  date: string
  current_week: number
  baby_size: string | null
  tip: string | null
  appointment_date: string | null
}

const fruitByWeek: Record<number, string> = {
  12: 'Lime',
  16: 'Avocado',
  20: 'Banana',
  24: 'Corn',
  28: 'Eggplant',
  32: 'Squash',
  36: 'Papaya',
  40: 'Watermelon',
}

export default function DashboardPage() {
  const supabase = createClient()
  const { mode, loading: modeLoading, userId } = useMode()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cycles, setCycles] = useState<CycleRow[]>([])
  const [symptoms, setSymptoms] = useState<SymptomRow[]>([])
  const [pregnancyLogs, setPregnancyLogs] = useState<PregnancyLogRow[]>([])

  const [flow, setFlow] = useState('medium')
  const [mood, setMood] = useState('calm')
  const [symptomName, setSymptomName] = useState('')
  const [symptomNotes, setSymptomNotes] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const cycleResult = await supabase
          .from('cycles')
          .select('id,date,is_period,is_fertile,is_ovulation')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(90)

        let cycleRows = (cycleResult.data ?? []) as CycleRow[]
        if (cycleResult.error) {
          const fallback = await supabase
            .from('cycle_logs')
            .select('id,date,phase')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(90)

          type LegacyCycleLog = { id: string; date: string; phase: string }
          cycleRows = (fallback.data ?? []).map((row: LegacyCycleLog) => ({
            id: row.id,
            date: row.date,
            is_period: row.phase === 'period',
            is_fertile: row.phase === 'fertile',
            is_ovulation: row.phase === 'ovulation',
          }))
        }

        const symptomResult = await supabase
          .from('symptoms')
          .select('id,symptom_name,notes,intensity,date')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(20)

        const pregnancyResult = await supabase
          .from('pregnancy_logs')
          .select('id,date,current_week,baby_size,tip,appointment_date')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(20)

        setCycles(cycleRows)
        setSymptoms((symptomResult.data ?? []) as SymptomRow[])
        setPregnancyLogs((pregnancyResult.data ?? []) as PregnancyLogRow[])
      } catch {
        setError('We could not load your dashboard data right now. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [supabase, userId, mode])

  const periodDayCount = useMemo(() => cycles.filter((item) => item.is_period).length, [cycles])
  const latestPeriod = useMemo(() => cycles.find((item) => item.is_period), [cycles])
  const nextPeriodDate = useMemo(() => {
    if (!latestPeriod?.date) return null
    return addDays(new Date(latestPeriod.date), 28)
  }, [latestPeriod])

  const fertilityWindow = useMemo(() => {
    if (!latestPeriod?.date) return null
    const start = addDays(new Date(latestPeriod.date), 11)
    const end = addDays(new Date(latestPeriod.date), 16)
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
  }, [latestPeriod])

  const latestPregnancy = pregnancyLogs[0]
  const nextAppointment = pregnancyLogs.find((item) => item.appointment_date)
  const currentWeek = latestPregnancy?.current_week ?? 20
  const trimesterProgress = Math.min(Math.round((currentWeek / 40) * 100), 100)
  const fruitSize = latestPregnancy?.baby_size ?? fruitByWeek[20]

  const handleSymptomLog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!userId || !symptomName.trim()) return

    setSaving(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')

      const cycleDetails = `flow=${flow}; mood=${mood}`

      await supabase.from('symptoms').insert({
        user_id: userId,
        date: today,
        symptom_name: symptomName.trim(),
        intensity: 3,
        notes: [cycleDetails, symptomNotes.trim()].filter(Boolean).join(' | ') || null,
      })

      if (mode === 'cycle') {
        await supabase.from('cycles').insert({
          user_id: userId,
          date: today,
          flow,
          mood,
          notes: symptomNotes.trim() || null,
          is_period: flow !== 'none',
          is_fertile: false,
          is_ovulation: false,
        })
      } else {
        await supabase.from('pregnancy_logs').insert({
          user_id: userId,
          date: today,
          current_week: currentWeek,
          baby_size: fruitSize,
          tip: 'Stay hydrated and rest well today.',
          appointment_date: null,
        })
      }

      setSymptomName('')
      setSymptomNotes('')
      setError(null)
    } catch {
      setError('Could not save this log. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (modeLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar title="Dashboard" subtitle="Loading your health overview" />
        <div className="mx-auto flex min-h-[60vh] w-full max-w-6xl items-center justify-center px-4">
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
        </div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar title="Welcome" subtitle="Please sign in to start tracking" />
        <div className="mx-auto max-w-xl px-4 py-10">
          <Card className="border-0 p-6 text-center">
            <p className="text-sm text-muted-foreground">You need an account (or anonymous sign-in) to save health data.</p>
            <Link href="/auth/login"><Button className="mt-4">Go to Login</Button></Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppNavbar
        title={mode === 'cycle' ? 'Cycle Tracking Mode' : 'Pregnancy Tracking Mode'}
        subtitle={mode === 'cycle' ? 'Current day, next period, fertility window, and ovulation insights' : 'Weekly development, health tips, symptoms, and reminders'}
      />

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6">
        {error ? (
          <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          {mode === 'cycle' ? (
            <>
              <Card className="border-0 bg-gradient-to-br from-pink-50 to-purple-50 p-5">
                <p className="text-xs text-muted-foreground">Current Cycle Day</p>
                <p className="mt-1 text-2xl font-bold">Day {Math.max(1, periodDayCount % 28)}</p>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 p-5">
                <p className="text-xs text-muted-foreground">Next Period</p>
                <p className="mt-1 text-2xl font-bold">{nextPeriodDate ? format(nextPeriodDate, 'MMM d') : 'No data yet'}</p>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 p-5">
                <p className="text-xs text-muted-foreground">Fertility Window</p>
                <p className="mt-1 text-2xl font-bold">{fertilityWindow ?? 'No data yet'}</p>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-0 bg-gradient-to-br from-pink-50 to-purple-50 p-5">
                <p className="text-xs text-muted-foreground">Current Pregnancy Week</p>
                <p className="mt-1 text-2xl font-bold">Week {currentWeek}</p>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-purple-50 to-blue-50 p-5">
                <p className="text-xs text-muted-foreground">Baby Size</p>
                <p className="mt-1 text-2xl font-bold">{fruitSize ?? 'Banana'}</p>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-pink-50 p-5">
                <p className="text-xs text-muted-foreground">Trimester Progress</p>
                <div className="mt-3 h-2 w-full rounded-full bg-white">
                  <div className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" style={{ width: `${trimesterProgress}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold">{trimesterProgress}% complete</p>
              </Card>
            </>
          )}
        </div>

        <Card className="border-0 p-5">
          <h2 className="mb-4 text-lg font-bold">{mode === 'cycle' ? 'Symptom Logging' : 'Daily Check-In'}</h2>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleSymptomLog}>
            <Input value={symptomName} onChange={(event) => setSymptomName(event.target.value)} placeholder={mode === 'cycle' ? 'e.g. cramps' : 'e.g. nausea'} required />
            <Input value={flow} onChange={(event) => setFlow(event.target.value)} placeholder={mode === 'cycle' ? 'flow: light/medium/heavy' : 'energy: low/medium/high'} />
            <Input value={mood} onChange={(event) => setMood(event.target.value)} placeholder="mood" />
            <Textarea value={symptomNotes} onChange={(event) => setSymptomNotes(event.target.value)} placeholder="Notes" className="md:col-span-2" />
            <Button type="submit" disabled={saving} className="md:col-span-2">
              {saving ? 'Saving...' : mode === 'cycle' ? 'Save Symptom & Flow' : 'Save Pregnancy Check-In'}
            </Button>
          </form>
        </Card>

        {mode === 'cycle' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-0 p-5">
              <div className="mb-3 flex items-center gap-2"><Flower2 className="h-4 w-4 text-primary" /><h3 className="font-semibold">Ovulation Prediction</h3></div>
              <p className="text-sm text-muted-foreground">Estimated ovulation: {latestPeriod?.date ? format(addDays(new Date(latestPeriod.date), 14), 'MMM d') : 'No data yet'}</p>
            </Card>
            <Card className="border-0 p-5">
              <div className="mb-3 flex items-center gap-2"><HeartPulse className="h-4 w-4 text-primary" /><h3 className="font-semibold">Recent Symptoms</h3></div>
              {symptoms.length === 0 ? <p className="text-sm text-muted-foreground">No symptom logs yet.</p> : (
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {symptoms.slice(0, 4).map((item) => (
                    <li key={item.id}>{item.symptom_name} • {format(new Date(item.date), 'MMM d')}</li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-0 p-5">
              <div className="mb-3 flex items-center gap-2"><Baby className="h-4 w-4 text-primary" /><h3 className="font-semibold">Weekly Development</h3></div>
              <p className="text-sm text-muted-foreground">Week {currentWeek}: Your baby is around the size of a {fruitSize?.toLowerCase() ?? 'banana'}.</p>
            </Card>
            <Card className="border-0 p-5">
              <div className="mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><h3 className="font-semibold">Appointment Reminders</h3></div>
              {nextAppointment?.appointment_date ? (
                <p className="text-sm text-muted-foreground">Next appointment: {format(new Date(nextAppointment.appointment_date), 'MMM d')}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No appointments scheduled yet.</p>
              )}
            </Card>
          </div>
        )}

        <InsightsCharts />

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">AI Health Assistant</h3>
              <p className="text-sm text-muted-foreground">Ask about periods, pregnancy, and symptoms.</p>
            </div>
            <Link href="/assistant"><Button><Sparkles className="mr-2 h-4 w-4" />Open Assistant</Button></Link>
          </div>
        </Card>
      </main>

      <AppBottomNav />
    </div>
  )
}
