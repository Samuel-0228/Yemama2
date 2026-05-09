'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TrackingModeToggle } from '@/components/tracking-mode-toggle'
import { MobileNav } from '@/components/mobile-nav'
import { User, Plus, Heart } from 'lucide-react'
import { getPregnancyWeekInfo } from '@/lib/pregnancy/week-data'

interface PregnancyData {
  id: string
  conception_date: string
  current_week: number
  baby_weight?: number
  baby_height?: number
  mother_condition?: string
  due_date: string
}

export default function PregnancyPage() {
  const [user, setUser] = useState<any>(null)
  const [pregnancyData, setPregnancyData] = useState<PregnancyData | null>(null)
  const [mode, setMode] = useState<'period' | 'pregnancy'>('pregnancy')
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

        setUser(authUser)

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('tracking_type')
          .eq('user_id', authUser.id)
          .single()

        if (profileData?.tracking_type === 'period') {
          setMode('period')
        }

        const localMode = typeof window !== 'undefined' ? localStorage.getItem('yemama-tracking-mode') : null
        if (localMode === 'period' || localMode === 'pregnancy') {
          setMode(localMode)
        }

        const { data: pregData } = await supabase
          .from('pregnancy_data')
          .select('*')
          .eq('user_id', authUser.id)
          .single()

        if (pregData) {
          setPregnancyData(pregData)
        }
      } catch (err) {
        console.error('Error fetching pregnancy data:', err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const getBabyStage = (week: number) => {
    if (week < 4) return 'Conception'
    if (week < 8) return 'Embryo'
    if (week < 12) return 'Fetal Stage'
    if (week < 16) return 'Tiny Bean'
    if (week < 20) return 'Forming Features'
    if (week < 24) return 'Viable Baby'
    if (week < 28) return 'Quickening'
    if (week < 32) return 'Kicking Baby'
    if (week < 36) return 'Nearly There'
    return 'Ready to Meet'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading pregnancy data...</p>
      </div>
    )
  }

  if (!pregnancyData) {
    return (
      <div className="min-h-screen pb-24">
        <div className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-semibold text-foreground">Pregnancy Journey</h1>
            <TrackingModeToggle userId={user?.id} mode={mode} onModeChange={setMode} />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="p-8 text-center border-0 bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="text-5xl mb-4">🤰</div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Start Your Journey</h2>
            <p className="text-muted-foreground mb-6">
              Add your pregnancy information to start tracking your baby's development and your health
            </p>
            <Button className="bg-gradient-to-r from-primary to-accent text-white" onClick={() => router.push('/auth/onboarding?mode=pregnancy')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pregnancy Info
            </Button>
          </Card>
        </div>

        <MobileNav active="dashboard" />
      </div>
    )
  }

  const currentWeek = pregnancyData.current_week || 20
  const progress = (currentWeek / 40) * 100
  const weeksRemaining = 40 - currentWeek
  const weekInfo = getPregnancyWeekInfo(currentWeek)

  if (mode === 'period') {
    return (
      <div className="min-h-screen pb-24">
        <div className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-semibold text-foreground">Pregnancy Journey</h1>
            <TrackingModeToggle userId={user?.id} mode={mode} onModeChange={setMode} />
          </div>
        </div>
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <Card className="glass-card border-0 p-8 text-center">
            <h2 className="text-2xl font-semibold">Pregnancy tools are hidden in Cycle Mode</h2>
            <p className="mt-2 text-sm text-muted-foreground">Switch back to Pregnancy Mode to continue this view.</p>
            <div className="mt-5">
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          </Card>
        </div>
        <MobileNav active="dashboard" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Your Pregnancy Journey</h1>
            <p className="text-muted-foreground text-sm">
              Week {currentWeek} of 40 • {weeksRemaining} weeks to go
            </p>
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

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Illustration */}
          <div className="lg:col-span-1">
            <Card className="p-4 border-0 overflow-hidden sticky top-32">
              <Image
                src="/images/pregnancy-development.jpg"
                alt="Pregnancy development timeline"
                width={400}
                height={500}
                className="w-full h-auto rounded-lg object-cover"
              />
              <div className="mt-4">
                <p className="text-sm font-semibold text-foreground mb-2">Current Stage</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {getBabyStage(currentWeek)}
                </p>
              </div>
            </Card>
          </div>

          {/* Pregnancy Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Bar */}
            <Card className="p-6 border-0">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-foreground">Pregnancy Progress</h3>
                  <span className="text-sm font-semibold text-primary">{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-4" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-1">{currentWeek}</div>
                  <p className="text-xs text-muted-foreground">Weeks Passed</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent mb-1">{weeksRemaining}</div>
                  <p className="text-xs text-muted-foreground">Weeks Left</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">40</div>
                  <p className="text-xs text-muted-foreground">Total Weeks</p>
                </div>
              </div>
            </Card>

            {/* Baby Development */}
            <Card className="p-6 border-0 bg-gradient-to-br from-pink-50 to-purple-50">
              <h3 className="font-bold text-foreground mb-4">Baby Development</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Baby size this week
                  </label>
                  <div className="text-2xl font-bold text-foreground">
                    {weekInfo.babySize}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Development milestone
                  </label>
                  <p className="text-sm text-muted-foreground leading-relaxed">{weekInfo.milestone}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-4">
                  <p className="text-sm font-semibold text-foreground">Tip for week {weekInfo.week}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{weekInfo.tip}</p>
                </div>
              </div>
            </Card>

            {/* Mother's Health */}
            <Card className="p-6 border-0">
              <h3 className="font-bold text-foreground mb-4">Your Health</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-primary mt-1" />
                    <div>
                      <p className="font-semibold text-foreground">Physical Condition</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {pregnancyData.mother_condition || 'No health notes recorded'}
                      </p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full" onClick={() => router.push('/symptoms')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Log symptoms & get advice
                </Button>
              </div>
            </Card>

            {/* Due Date */}
            <Card className="p-6 border-0 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">Expected Due Date</p>
                <p className="text-3xl font-bold text-foreground mb-2">
                  {new Date(pregnancyData.due_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {weeksRemaining} weeks and {Math.round((weeksRemaining * 7) % 7)} days to go
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <MobileNav active="dashboard" />
    </div>
  )
}
