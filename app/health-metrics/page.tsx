'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { MobileNav } from '@/components/mobile-nav'
import { Activity, Bed, Footprints, Gauge, HeartPulse } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type MetricKey = 'blood_pressure' | 'heart_rate' | 'sleep_duration' | 'energy_level' | 'steps'
type MetricStatus = 'Normal' | 'Moderate' | 'Danger'

type TrendPoint = { date: string; value: number }

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function evaluateMetric(metric: MetricKey, value: number, extra?: { dia?: number }): { status: MetricStatus; advice: string } {
  if (metric === 'blood_pressure') {
    const sys = value
    const dia = extra?.dia ?? 0
    if (sys >= 140 || dia >= 90) return { status: 'Danger', advice: 'Your blood pressure is high. Reduce salt, rest, and contact a clinician soon—seek urgent care if you have headache/vision changes or swelling.' }
    if (sys >= 120 || dia >= 80) return { status: 'Moderate', advice: 'Your blood pressure is slightly elevated. Hydrate, rest, avoid excess salt, and re-check later today.' }
    return { status: 'Normal', advice: 'Blood pressure looks within a typical range. Keep hydration and gentle activity.' }
  }

  if (metric === 'heart_rate') {
    if (value > 110 || value < 50) return { status: 'Danger', advice: 'Heart rate is outside a typical resting range. Sit, breathe slowly, hydrate, and seek medical advice if you feel dizzy, faint, or have chest pain.' }
    if (value > 100 || value < 60) return { status: 'Moderate', advice: 'Heart rate is slightly outside the typical resting range. Rest and re-check when calm.' }
    return { status: 'Normal', advice: 'Heart rate looks within a typical resting range.' }
  }

  if (metric === 'sleep_duration') {
    if (value < 5) return { status: 'Danger', advice: 'Low sleep detected. Aim for at least 7 hours—try an earlier bedtime, reduce caffeine late in the day, and rest when possible.' }
    if (value < 7) return { status: 'Moderate', advice: 'Sleep is a bit low. Try a consistent bedtime and a short nap if you can.' }
    return { status: 'Normal', advice: 'Great—your sleep duration is in a healthy range.' }
  }

  if (metric === 'energy_level') {
    if (value <= 3) return { status: 'Danger', advice: 'Very low energy today. Rest, hydrate, and eat something nourishing. If this persists or you feel unwell, contact a clinician.' }
    if (value <= 6) return { status: 'Moderate', advice: 'Moderate energy. Pace yourself and take breaks. A light walk and hydration can help.' }
    return { status: 'Normal', advice: 'Energy looks good. Keep a steady routine and hydration.' }
  }

  // steps
  if (value < 3000) return { status: 'Danger', advice: 'Low activity today. If safe, try a short 10–15 minute walk and gentle stretching.' }
  if (value < 7000) return { status: 'Moderate', advice: 'Moderate activity. A short walk can help circulation and mood.' }
  return { status: 'Normal', advice: 'Great activity level—keep it comfortable and steady.' }
}

const METRICS: Array<{ key: MetricKey; title: string; icon: React.ReactNode; color: string }> = [
  { key: 'blood_pressure', title: 'Blood pressure', icon: <Gauge className="h-5 w-5" />, color: 'from-teal-50 to-green-50' },
  { key: 'heart_rate', title: 'Heart rate', icon: <HeartPulse className="h-5 w-5" />, color: 'from-rose-50 to-orange-50' },
  { key: 'sleep_duration', title: 'Sleep', icon: <Bed className="h-5 w-5" />, color: 'from-indigo-50 to-purple-50' },
  { key: 'energy_level', title: 'Energy', icon: <Activity className="h-5 w-5" />, color: 'from-amber-50 to-yellow-50' },
  { key: 'steps', title: 'Steps', icon: <Footprints className="h-5 w-5" />, color: 'from-yellow-50 to-orange-50' },
]

export default function HealthMetricsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [userId, setUserId] = useState<string | null>(null)
  const [activeMetric, setActiveMetric] = useState<MetricKey>('blood_pressure')
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [value, setValue] = useState('')
  const [value2, setValue2] = useState('') // diastolic for BP
  const [notes, setNotes] = useState('')

  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [latest, setLatest] = useState<{ status: MetricStatus; advice: string; display: string } | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)
    }
    init()
  }, [])

  const unit = useMemo(() => {
    if (activeMetric === 'heart_rate') return 'bpm'
    if (activeMetric === 'sleep_duration') return 'hours'
    if (activeMetric === 'energy_level') return 'score'
    if (activeMetric === 'steps') return 'steps'
    return 'mmHg'
  }, [activeMetric])

  const loadTrend = async (uid: string, metric: MetricKey) => {
    const { data, error } = await supabase
      .from('health_metrics')
      .select('date, value, notes')
      .eq('user_id', uid)
      .eq('metric_type', metric)
      .order('date', { ascending: true })
      .limit(60)

    if (error) {
      toast({ title: 'Unable to load trends', description: error.message, variant: 'destructive' })
      return
    }

    const points: TrendPoint[] = (data || [])
      .filter((r: any) => typeof r.value === 'number' || typeof r.value === 'string')
      .map((r: any) => ({ date: r.date, value: Number(r.value) }))
      .filter((p) => Number.isFinite(p.value))

    setTrend(points)

    const last = (data || []).slice(-1)[0]
    if (last?.value != null) {
      const extra = metric === 'blood_pressure' ? { dia: Number(String(last.notes || '').split('/')[1] || 0) } : undefined
      const evald = evaluateMetric(metric, Number(last.value), extra)
      const display = metric === 'blood_pressure' ? String(last.notes || `${last.value}/?`) : `${Number(last.value)} ${unit}`
      setLatest({ status: evald.status, advice: evald.advice, display })
    } else {
      setLatest(null)
    }
  }

  useEffect(() => {
    if (!userId) return
    loadTrend(userId, activeMetric)
  }, [userId, activeMetric])

  const startMetric = (metric: MetricKey) => {
    setActiveMetric(metric)
    setOpen(true)
    setNotes('')
    setValue('')
    setValue2('')
    setDate(new Date().toISOString().split('T')[0])
  }

  const save = async () => {
    const uid = userId
    if (!uid) return

    setSaving(true)
    try {
      const v1 = Number(value)
      if (!date) throw new Error('Please select a date.')

      if (activeMetric === 'blood_pressure') {
        const sys = clamp(Number(value), 50, 250)
        const dia = clamp(Number(value2), 30, 150)
        if (!sys || !dia) throw new Error('Blood pressure needs both systolic and diastolic values.')

        const evald = evaluateMetric('blood_pressure', sys, { dia })
        await supabase.from('health_metrics').upsert({
          user_id: uid,
          date,
          metric_type: 'blood_pressure',
          value: sys,
          unit: 'mmHg',
          notes: `${sys}/${dia}`,
        }, { onConflict: 'user_id,date,metric_type' })

        toast({ title: `Saved • ${evald.status}`, description: evald.advice })
      } else {
        if (!Number.isFinite(v1) || v1 <= 0) throw new Error('Please enter a valid value.')

        const evald = evaluateMetric(activeMetric, v1)
        await supabase.from('health_metrics').upsert({
          user_id: uid,
          date,
          metric_type: activeMetric,
          value: v1,
          unit,
          notes: notes || null,
        }, { onConflict: 'user_id,date,metric_type' })

        toast({ title: `Saved • ${evald.status}`, description: evald.advice })
      }

      setOpen(false)
      await loadTrend(uid, activeMetric)
    } catch (err: any) {
      toast({ title: 'Unable to save', description: err?.message || 'Try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Health</p>
            <h1 className="text-xl font-semibold text-foreground">Health Metrics</h1>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Back</Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
        <Card className="glass-card border-0 p-4">
          <p className="text-sm font-semibold">Pick a metric</p>
          <p className="text-xs text-muted-foreground">Enter a value and Yemama will compare it to typical ranges and give simple advice.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {METRICS.map((m) => (
              <Card
                key={m.key}
                className={`border-0 bg-gradient-to-br ${m.color} p-4 transition hover:-translate-y-0.5`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {m.icon}
                    {m.title}
                  </div>
                  <Dialog open={open && activeMetric === m.key} onOpenChange={(v) => setOpen(v)}>
                    <DialogTrigger asChild>
                      <Button size="sm" onClick={() => startMetric(m.key)}>Log</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Log {m.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

                        {activeMetric === 'blood_pressure' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Systolic (e.g. 120)" />
                            <Input value={value2} onChange={(e) => setValue2(e.target.value)} placeholder="Diastolic (e.g. 80)" />
                          </div>
                        ) : (
                          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={`Value (${unit})`} />
                        )}

                        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" />

                        <Button onClick={save} disabled={saving} className="w-full">
                          {saving ? 'Saving...' : 'Save & analyze'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="glass-card border-0 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Latest insight</p>
              <p className="text-xs text-muted-foreground">Based on your most recent entry for {METRICS.find((m) => m.key === activeMetric)?.title.toLowerCase()}.</p>
            </div>
            <div className="flex items-center gap-2">
              {latest ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    latest.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' : latest.status === 'Moderate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {latest.status}
                </span>
              ) : null}
            </div>
          </div>

          {latest ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm">
                <span className="font-semibold text-foreground">Last value:</span> {latest.display}
              </p>
              <p className="text-sm text-muted-foreground">{latest.advice}</p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No entries yet for this metric. Tap “Log”.</p>
          )}
        </Card>

        <Card className="glass-card border-0 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Trend</p>
            <div className="flex gap-2">
              {METRICS.map((m) => (
                <Button
                  key={m.key}
                  size="sm"
                  variant={activeMetric === m.key ? 'default' : 'outline'}
                  onClick={() => setActiveMetric(m.key)}
                >
                  {m.title}
                </Button>
              ))}
            </div>
          </div>

          {trend.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No trend data yet.</p>
          ) : (
            <div className="mt-3 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <XAxis dataKey="date" hide />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#2563eb" name="Value" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <MobileNav active="dashboard" />
    </div>
  )
}

