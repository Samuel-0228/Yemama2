'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TrackingModeToggle } from '@/components/tracking-mode-toggle'
import { MobileNav } from '@/components/mobile-nav'
import { ChevronLeft, ChevronRight, Flag, Plus, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CycleLog {
  date: string
  phase: 'period' | 'fertile' | 'ovulation' | 'luteal'
  symptoms?: string[]
}

type Appointment = {
  id: string
  title: string
  scheduled_at: string
  notes: string | null
  reminder_minutes: number | null
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [cycleLogs, setCycleLogs] = useState<Map<string, CycleLog>>(new Map())
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mode, setMode] = useState<'period' | 'pregnancy'>('period')
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [apptOpen, setApptOpen] = useState(false)
  const [apptTitle, setApptTitle] = useState('')
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0])
  const [apptTime, setApptTime] = useState('09:00')
  const [apptReminder, setApptReminder] = useState('30')
  const [apptNotes, setApptNotes] = useState('')
  const [savingAppt, setSavingAppt] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/auth/login')
          return
        }

        setUser({ id: authUser.id })

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single()

        setProfile(profileData)
        if (profileData?.tracking_type) {
          setMode(profileData.tracking_type)
        }

        const localMode = typeof window !== 'undefined' ? localStorage.getItem('yemama-tracking-mode') : null
        if (localMode === 'period' || localMode === 'pregnancy') {
          setMode(localMode)
        }

        // Fetch cycle logs
        const { data: logsData } = await supabase
          .from('cycle_logs')
          .select('*')
          .eq('user_id', authUser.id)

        const logsMap = new Map()
        logsData?.forEach((log: any) => {
          logsMap.set(log.date, log)
        })
        setCycleLogs(logsMap)

        const { data: apptData } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', authUser.id)
          .order('scheduled_at', { ascending: true })
          .limit(50)
        setAppointments((apptData || []) as any)
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'period':
        return 'bg-red-300 text-white'
      case 'fertile':
        return 'bg-pink-300 text-white'
      case 'ovulation':
        return 'bg-purple-400 text-white'
      case 'luteal':
        return 'bg-blue-300 text-white'
      default:
        return 'bg-gray-100 text-foreground'
    }
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)

  const monthAppointments = appointments.filter((a) => {
    const d = new Date(a.scheduled_at)
    return d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()
  })

  const upcomingAppointments = appointments
    .filter((a) => new Date(a.scheduled_at).getTime() >= Date.now())
    .slice(0, 5)

  const saveAppointment = async () => {
    if (!user?.id) return
    const title = apptTitle.trim()
    if (!title) {
      toast({ title: 'Appointment title is required', variant: 'destructive' })
      return
    }

    setSavingAppt(true)
    try {
      const reminderMinutes = Number(apptReminder || 30)
      const scheduled = new Date(`${apptDate}T${apptTime}:00`)
      if (Number.isNaN(scheduled.getTime())) throw new Error('Invalid date/time')

      const { error } = await supabase.from('appointments').insert({
        user_id: user.id,
        title,
        scheduled_at: scheduled.toISOString(),
        notes: apptNotes.trim() || null,
        reminder_minutes: Number.isFinite(reminderMinutes) ? reminderMinutes : 30,
      })
      if (error) throw error

      const { data: apptData } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true })
        .limit(50)
      setAppointments((apptData || []) as any)

      setApptOpen(false)
      setApptTitle('')
      setApptNotes('')
      toast({ title: 'Appointment saved' })
    } catch (err: any) {
      toast({ title: 'Unable to save appointment', description: err?.message || 'Try again.', variant: 'destructive' })
    } finally {
      setSavingAppt(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading calendar...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Timeline</p>
            <h1 className="text-xl font-semibold text-foreground">{mode === 'pregnancy' ? 'Pregnancy Calendar' : 'Cycle Calendar'}</h1>
          </div>
          <div className="flex items-center gap-2">
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
        <Card className="glass-card border-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {mode === 'pregnancy'
                ? 'Track appointments and milestones week by week.'
                : `Cycle length ${profile?.cycle_length || 28} days • period length ${profile?.period_length || 5} days`}
            </p>
            <Dialog open={apptOpen} onOpenChange={setApptOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add appointment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>New appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Input value={apptTitle} onChange={(e) => setApptTitle(e.target.value)} placeholder="Title (e.g. Prenatal checkup)" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
                    <Input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} />
                  </div>
                  <Input value={apptReminder} onChange={(e) => setApptReminder(e.target.value)} placeholder="Reminder minutes (e.g. 30)" />
                  <Input value={apptNotes} onChange={(e) => setApptNotes(e.target.value)} placeholder="Notes (optional)" />
                  <Button onClick={saveAppointment} disabled={savingAppt} className="w-full">
                    {savingAppt ? 'Saving...' : 'Save appointment'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="rounded-2xl border-0 bg-white/70 p-5 shadow-none">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold text-foreground text-center flex-1">{monthName}</h2>
                <Button variant="outline" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                  <div key={day} className="text-center font-semibold text-muted-foreground text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                  const dateStr = date.toISOString().split('T')[0]
                  const log = cycleLogs.get(dateStr)
                  const apptCount = monthAppointments.filter((a) => a.scheduled_at.startsWith(dateStr)).length

                  const baseClass = mode === 'pregnancy' ? 'bg-cyan-50 text-foreground hover:bg-cyan-100' : 'bg-gray-50 text-foreground hover:bg-gray-100'

                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center rounded-lg font-semibold text-sm transition-all ${
                        mode === 'period' && log ? getPhaseColor(log.phase) : baseClass
                      } cursor-pointer`}
                    >
                      <div className="relative">
                        {day}
                        {apptCount > 0 ? <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" /> : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 border-t border-border pt-4">
                {mode === 'period' ? (
                  <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <span className="rounded-full bg-red-100 px-2 py-1 text-center">Period</span>
                    <span className="rounded-full bg-pink-100 px-2 py-1 text-center">Fertile</span>
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-center">Ovulation</span>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-center">Luteal</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Flag className="h-4 w-4 text-primary" />
                    Pregnancy mode hides cycle prediction markers.
                  </div>
                )}
              </div>
          </Card>
        </Card>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="p-4 border-0 bg-gradient-to-br from-red-50 to-pink-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {mode === 'pregnancy' ? '-' : Array.from(cycleLogs.values()).filter((l) => l.phase === 'period').length}
              </div>
              <p className="text-sm text-muted-foreground">{mode === 'pregnancy' ? 'Period tracking off' : 'Period days tracked'}</p>
            </div>
          </Card>
          <Card className="p-4 border-0 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {mode === 'pregnancy' ? String(upcomingAppointments.length) : Array.from(cycleLogs.values()).filter((l) => l.phase === 'ovulation').length}
              </div>
              <p className="text-sm text-muted-foreground">{mode === 'pregnancy' ? 'Appointments this month' : 'Ovulation days'}</p>
            </div>
          </Card>
          <Card className="p-4 border-0 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{mode === 'pregnancy' ? '40' : cycleLogs.size}</div>
              <p className="text-sm text-muted-foreground">{mode === 'pregnancy' ? 'Pregnancy weeks' : 'Total days logged'}</p>
            </div>
          </Card>
        </div>

        <Card className="glass-card border-0 p-5">
          <p className="text-sm font-semibold">Upcoming appointments</p>
          {upcomingAppointments.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No upcoming appointments. Add one above.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {upcomingAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(a.scheduled_at).toLocaleString()}
                      {a.reminder_minutes != null ? ` • reminder ${a.reminder_minutes}m` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Upcoming</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <MobileNav active="calendar" />
    </div>
  )
}
