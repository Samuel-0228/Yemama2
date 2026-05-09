'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { MobileNav } from '@/components/mobile-nav'
import Link from 'next/link'
import { Apple, CalendarDays, HeartPulse, NotebookPen } from 'lucide-react'

export default function TrackingLogsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Keep this route as a friendly "hub" to avoid broken deep links.
    // (Older parts of the app may still link to /tracking/logs.)
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center"><Spinner className="h-6 w-6" /></div>
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
        <Card className="glass-card border-0 p-4">
          <h1 className="text-xl font-semibold">Tracking</h1>
          <p className="text-sm text-muted-foreground">Choose what you want to log. Each log type has its own screen and analysis.</p>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { title: 'Symptom journal', desc: 'Multi-select symptoms + feedback', href: '/symptoms', Icon: NotebookPen },
            { title: 'Health metrics', desc: 'BP, heart rate, sleep, energy, steps', href: '/health-metrics', Icon: HeartPulse },
            { title: 'Food log', desc: 'Text meal log + calorie estimate', href: '/nutrition', Icon: Apple },
            { title: 'Appointments', desc: 'Upcoming appointments + reminders', href: '/calendar', Icon: CalendarDays },
          ].map(({ title, desc, href, Icon }) => (
            <Link key={href} href={href}>
              <Card className="glass-card border-0 p-4 transition hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3">
                  <Button size="sm">Open</Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <MobileNav active="dashboard" />
    </div>
  )
}
