'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrackingModeToggle } from '@/components/tracking-mode-toggle'
import { MobileNav } from '@/components/mobile-nav'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useI18n } from '@/lib/i18n'
import {
  CalendarCheck,
  ChartLine,
  Flower2,
  Baby,
  HeartPulse,
  AlarmClock,
  NotebookPen,
  ArrowRight,
  Sparkles,
  User,
  Siren,
  Stethoscope,
  Apple,
  TestTube,
} from 'lucide-react'

interface CycleLog {
  date: string
  phase: 'period' | 'fertile' | 'ovulation' | 'luteal'
  symptoms?: string[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mode, setMode] = useState<'period' | 'pregnancy'>('period')
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([])
  const [pregnancyData, setPregnancyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        setUser({ id: authUser.id })

        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single()

        let effectiveProfile = profileData

        if (profileError || !profileData) {
          const { data: insertedProfile } = await supabase
            .from('user_profiles')
            .insert({
              user_id: authUser.id,
              tracking_type: 'period',
              cycle_length: 28,
              period_length: 5,
            })
            .select('*')
            .single()

          effectiveProfile = insertedProfile
        }

        if (effectiveProfile) {
          setProfile(effectiveProfile)
          setMode(effectiveProfile.tracking_type || 'period')
        }

        const localMode = typeof window !== 'undefined' ? localStorage.getItem('yemama-tracking-mode') : null
        if ((localMode === 'period' || localMode === 'pregnancy') && localMode !== effectiveProfile?.tracking_type) {
          setMode(localMode)
        }

        const [{ data: logs }, { data: pregData }] = await Promise.all([
          supabase.from('cycle_logs').select('date, phase, symptoms').eq('user_id', authUser.id).order('date', { ascending: false }).limit(180),
          supabase.from('pregnancy_data').select('*').eq('user_id', authUser.id).single(),
        ])

        if (logs) {
          setCycleLogs(logs)
        }

        if (pregData) {
          setPregnancyData(pregData)
        }
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const { t } = useI18n()
  const d = t.dashboard

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🌸</div>
          <p className="text-muted-foreground">{d.loading}</p>
        </div>
      </div>
    )
  }

  const latestPeriod = cycleLogs.find((log) => log.phase === 'period')
  const cycleLength = profile?.cycle_length || 28
  const today = new Date()

  const latestPeriodDate = latestPeriod?.date ? new Date(latestPeriod.date) : null
  const dayDiff = latestPeriodDate ? Math.max(0, Math.floor((today.getTime() - latestPeriodDate.getTime()) / (1000 * 60 * 60 * 24))) : 0
  const cycleDay = (dayDiff % cycleLength) + 1
  const daysToNextPeriod = cycleLength - ((cycleDay - 1) % cycleLength)

  const nextPeriodDate = new Date(today)
  nextPeriodDate.setDate(today.getDate() + daysToNextPeriod)

  const ovulationStart = new Date(nextPeriodDate)
  ovulationStart.setDate(ovulationStart.getDate() - 16)
  const ovulationEnd = new Date(nextPeriodDate)
  ovulationEnd.setDate(ovulationEnd.getDate() - 12)

  const currentWeek = pregnancyData?.current_week || 20
  const isLatePregnancy = mode === 'pregnancy' && currentWeek >= 32
  const trimester = currentWeek < 14 ? 'First' : currentWeek < 28 ? 'Second' : 'Third'
  const progress = Math.min(100, Math.round((currentWeek / 40) * 100))
  const fruitByWeek = currentWeek < 8 ? 'Blueberry' : currentWeek < 14 ? 'Lemon' : currentWeek < 20 ? 'Mango' : currentWeek < 28 ? 'Eggplant' : 'Watermelon'

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Dashboard</p>
            <h1 className="text-xl font-semibold text-foreground">{mode === 'period' ? d.title_period : d.title_pregnancy}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <TrackingModeToggle userId={user?.id} mode={mode} onModeChange={setMode} />
            <Link href="/profile">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                <User className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6">
        {isLatePregnancy ? (
          <Link href="/emergency">
            <Card className="border-red-500 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700">{d.labor_mode}</p>
                  <p className="text-xs text-red-600">{d.labor_desc}</p>
                </div>
                <Siren className="h-5 w-5 text-red-600" />
              </div>
            </Card>
          </Link>
        ) : null}

        {mode === 'period' ? (
          <>
            <Card className="glass-card border-0 bg-gradient-to-br from-cyan-50 to-pink-50 p-6">
              <p className="soft-pill mb-3 inline-flex">{d.period_mode}</p>
              <h2 className="text-2xl font-semibold text-foreground">{d.cycle_glance}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{d.cycle_desc}</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="text-[11px] text-muted-foreground">{d.today}</p>
                  <p className="text-lg font-semibold">Day {cycleDay}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="text-[11px] text-muted-foreground">{d.next_period}</p>
                  <p className="text-lg font-semibold">{daysToNextPeriod}d</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-3">
                  <p className="text-[11px] text-muted-foreground">{d.cycle_avg}</p>
                  <p className="text-lg font-semibold">{cycleLength}d</p>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="glass-card border-0 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{d.fertility_window}</p>
                    <p className="text-xs text-muted-foreground">
                      {ovulationStart.toLocaleDateString()} - {ovulationEnd.toLocaleDateString()}
                    </p>
                  </div>
                  <Flower2 className="h-5 w-5 text-primary" />
                </div>
              </Card>
              <Card className="glass-card border-0 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{d.cycle_insight}</p>
                    <p className="text-xs text-muted-foreground">
                      {cycleLogs.length > 20 ? d.insight_consistent : d.insight_log_more}
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [d.links.calendar, '/calendar', CalendarCheck],
                [d.links.symptom, '/symptoms', NotebookPen],
                [d.links.mood, '/symptoms', ChartLine],
                [d.links.health, '/health-metrics', HeartPulse],
                [d.links.nutrition, '/nutrition', Apple],
              ].map(([title, href, Icon]) => (
                <Link key={title as string} href={href as string}>
                  <Card className="glass-card border-0 p-4 transition hover:-translate-y-0.5">
                    <div className="mb-3 flex items-center justify-between">
                      <Icon className="h-5 w-5 text-primary" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold">{title as string}</h3>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <>
            <Card className="glass-card border-0 bg-gradient-to-br from-emerald-50 to-cyan-50 p-6">
              <p className="soft-pill mb-3 inline-flex">{d.pregnancy_mode}</p>
              <h2 className="text-2xl font-semibold text-foreground">{d.week_journey.replace('{week}', String(currentWeek))}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{d.baby_size_text.replace('{fruit}', fruitByWeek.toLowerCase())}</p>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{trimester} {d.trimester}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-white/70" />
              </div>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="glass-card border-0 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{d.weekly_dev}</p>
                    <p className="text-xs text-muted-foreground">{d.weekly_dev_desc}</p>
                  </div>
                  <Baby className="h-5 w-5 text-primary" />
                </div>
              </Card>
              <Card className="glass-card border-0 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{d.daily_tip}</p>
                    <p className="text-xs text-muted-foreground">{d.daily_tip_desc}</p>
                  </div>
                  <HeartPulse className="h-5 w-5 text-accent" />
                </div>
              </Card>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                [d.links.pregnancy, '/pregnancy', Baby],
                [d.links.appointment, '/calendar', AlarmClock],
                [d.links.symptoms_notes, '/symptoms', NotebookPen],
                [d.links.wellness, '/health-metrics', ChartLine],
                [d.links.doctor, '/doctor', Stethoscope],
                [d.links.labs, '/labs', TestTube],
              ].map(([title, href, Icon]) => (
                <Link key={title as string} href={href as string}>
                  <Card className="glass-card border-0 p-4 transition hover:-translate-y-0.5">
                    <div className="mb-3 flex items-center justify-between">
                      <Icon className="h-5 w-5 text-primary" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold">{title as string}</h3>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}

        <Card className="glass-card border-0 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{d.quick_actions}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/calendar">
              <Button size="sm">{d.open_calendar}</Button>
            </Link>
            <Link href={mode === 'period' ? '/symptoms' : '/pregnancy'}>
              <Button size="sm" variant="outline">
                {mode === 'period' ? d.log_today : d.view_weekly}
              </Button>
            </Link>
            <Link href={mode === 'period' ? '/symptoms' : '/health-metrics'}>
              <Button size="sm" variant="outline">{d.get_advice}</Button>
            </Link>
            <Link href="/education">
              <Button size="sm" variant="outline">{d.learn}</Button>
            </Link>
          </div>
        </Card>
      </div>

      <MobileNav active="dashboard" />
    </div>
  )
}
