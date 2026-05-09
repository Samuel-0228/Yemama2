'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, Sparkles, Baby, Brain } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ModeAwareCta } from '@/components/app-navbar'

export default function HomePage() {
  const supabase = createClient()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(Boolean(user))
    }
    void run()
  }, [supabase])

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-blue-50">
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-10 pt-10 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary shadow-sm">Dual-Mode Health Tracker</p>
          <h1 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">Understand Your Body. Every Day.</h1>
          <p className="text-sm text-muted-foreground md:text-base">Track your cycle, predict your future, and support your journey through every phase.</p>
          <ModeAwareCta />
          {isLoggedIn ? (
            <Link href="/dashboard"><Button variant="outline" className="rounded-full">Open Dashboard</Button></Link>
          ) : null}
        </div>

        <Card className="overflow-hidden rounded-3xl border-0 p-4 shadow-lg">
          <div className="mx-auto max-w-xs rounded-[2.4rem] border-8 border-foreground/10 bg-white p-4">
            <Image src="/images/mother-child-dashboard.jpg" alt="App mockup" width={400} height={500} className="h-64 w-full rounded-2xl object-cover" />
            <div className="mt-3 space-y-2">
              <div className="h-3 rounded-full bg-pink-100" />
              <div className="h-3 w-2/3 rounded-full bg-purple-100" />
              <div className="h-3 w-1/2 rounded-full bg-blue-100" />
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-10 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Smart Cycle Predictions', icon: Sparkles },
          { title: 'Pregnancy Week Tracking', icon: Baby },
          { title: 'AI Health Assistant', icon: Brain },
          { title: 'Privacy-First Design', icon: ShieldCheck },
        ].map((feature) => {
          const Icon = feature.icon
          return (
            <Card key={feature.title} className="rounded-2xl border-0 bg-white/80 p-5">
              <Icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold text-foreground">{feature.title}</h3>
            </Card>
          )
        })}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-2xl font-bold">How It Works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {['Log your data', 'Get predictions', 'Understand your body'].map((step, idx) => (
            <Card key={step} className="rounded-2xl border-0 bg-white p-5">
              <p className="text-xs font-semibold text-primary">Step {idx + 1}</p>
              <p className="mt-1 text-sm font-medium">{step}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-2xl font-bold">What Users Say</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            '“The mode switch makes this feel like two apps in one. I use both at different life stages.” — Maya',
            '“Predictions and reminders are calm, clear, and actually useful.” — Elena',
            '“I trust this app because privacy settings are always visible.” — Noor',
          ].map((quote) => (
            <Card key={quote} className="rounded-2xl border-0 bg-white p-5 text-sm text-muted-foreground">{quote}</Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <Card className="rounded-2xl border-0 bg-white p-6">
          <h2 className="text-xl font-bold">Trust & Safety</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your health data is protected with encryption, strict access controls, and privacy-first defaults.</p>
        </Card>
      </section>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground">
        <span>© yemama</span>
        <div className="flex gap-4">
          <Link href="/profile">About</Link>
          <Link href="/profile">Privacy</Link>
          <Link href="/profile">Contact</Link>
        </div>
      </footer>
    </main>
  )
}
