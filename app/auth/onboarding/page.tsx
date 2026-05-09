'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function OnboardingPage() {
  const [trackingType, setTrackingType] = useState<'period' | 'pregnancy' | null>(null)
  const [isPregnant, setIsPregnant] = useState<boolean | null>(null)
  const [cycleLengthInput, setCycleLengthInput] = useState('28')
  const [periodLengthInput, setPeriodLengthInput] = useState('5')
  const [pregnancyStartDate, setPregnancyStartDate] = useState('')
  const [pregnancyWeek, setPregnancyWeek] = useState('')
  const [pregnancyMonth, setPregnancyMonth] = useState('')
  const [age, setAge] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [conditions, setConditions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const router = useRouter()
  const supabase = createClient()

  const handleTrackingTypeSelect = (type: 'period' | 'pregnancy') => {
    setTrackingType(type)
    setStep(2)
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const presetMode = searchParams.get('mode')
    if (presetMode === 'period' || presetMode === 'pregnancy') {
      setTrackingType(presetMode)
      setStep(2)
    }
  }, [])

  const handleComplete = async () => {
    if (!trackingType) return

    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const parsedAge = age ? Number(age) : null
      const parsedWeight = weightKg ? Number(weightKg) : null
      const parsedHeight = heightCm ? Number(heightCm) : null
      const parsedConditions = conditions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const { error } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        tracking_type: trackingType,
        cycle_length: parseInt(cycleLengthInput),
        period_length: parseInt(periodLengthInput),
        age: parsedAge,
        weight_kg: parsedWeight,
        height_cm: parsedHeight,
        conditions: parsedConditions.length ? parsedConditions : null,
      }, { onConflict: 'user_id' })

      if (error) throw error

      if (trackingType === 'pregnancy') {
        const weekFromMonth = Number(pregnancyMonth || 0) ? Math.max(1, Math.round(Number(pregnancyMonth) * 4)) : 0
        const weekValue = Number(pregnancyWeek || 0) || weekFromMonth
        if (!pregnancyStartDate && !weekValue) {
          throw new Error('Provide pregnancy start date, current week, or current month.')
        }
        const startDate = pregnancyStartDate || (() => {
          const d = new Date()
          d.setDate(d.getDate() - weekValue * 7)
          return d.toISOString().split('T')[0]
        })()
        const dueDate = new Date(startDate)
        dueDate.setDate(dueDate.getDate() + 280)

        await supabase.from('pregnancy_data').upsert({
          user_id: user.id,
          conception_date: startDate,
          current_week: weekValue || Math.floor((Date.now() - new Date(startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          due_date: dueDate.toISOString().split('T')[0],
        }, { onConflict: 'user_id' })
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      console.error('Onboarding error:', err)
      setError(err?.message || 'Unable to complete onboarding.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Welcome to yemama
          </h1>
          <p className="text-muted-foreground text-lg">Let&apos;s get you started</p>
        </div>

        {/* Step 1: Select tracking type */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-center text-foreground font-semibold text-lg mb-6">
              What would you like to track?
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                onClick={() => { setIsPregnant(false); handleTrackingTypeSelect('period') }}
                className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Period Tracking</h3>
                  <p className="text-muted-foreground text-sm">
                    Track your menstrual cycle, symptoms, and fertility window
                  </p>
                </div>
              </Card>

              <Card
                onClick={() => { setIsPregnant(true); handleTrackingTypeSelect('pregnancy') }}
                className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary"
              >
                <div className="text-center">
                  <div className="text-5xl mb-4">🤰</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Pregnancy Tracking</h3>
                  <p className="text-muted-foreground text-sm">
                    Follow your baby&apos;s development and monitor your health
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Configure preferences */}
        {step === 2 && trackingType === 'period' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Customize Your Cycle</h2>
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min="12"
                  max="60"
                  placeholder="Age"
                  title="Age"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  min="20"
                  max="250"
                  placeholder="Weight (kg)"
                  title="Weight in kilograms"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  min="80"
                  max="220"
                  placeholder="Height (cm)"
                  title="Height in centimeters"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <input
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="Existing conditions (optional, comma-separated)"
                title="Existing conditions"
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />

              <div>
                <label htmlFor="cycle-length" className="block text-sm font-medium text-foreground mb-2">
                  Average Cycle Length (days)
                </label>
                <input
                  id="cycle-length"
                  type="number"
                  value={cycleLengthInput}
                  onChange={(e) => setCycleLengthInput(e.target.value)}
                  min="21"
                  max="35"
                  placeholder="28"
                  title="Average cycle length in days"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">Typical range: 21-35 days</p>
              </div>

              <div>
                <label htmlFor="period-length" className="block text-sm font-medium text-foreground mb-2">
                  Average Period Length (days)
                </label>
                <input
                  id="period-length"
                  type="number"
                  value={periodLengthInput}
                  onChange={(e) => setPeriodLengthInput(e.target.value)}
                  min="2"
                  max="7"
                  placeholder="5"
                  title="Average period length in days"
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-2">Typical range: 2-7 days</p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                >
                  {loading ? 'Setting up...' : 'Get Started'}
                </Button>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          </Card>
        )}

        {/* Step 2: Pregnancy info */}
        {step === 2 && trackingType === 'pregnancy' && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Start Your Pregnancy Journey</h2>
            <div className="space-y-6">
              <p className="text-muted-foreground">
                Are you pregnant? If yes, add start date or current week to activate Pregnancy Mode timeline.
              </p>
              <div className="flex gap-2">
                <Button variant={isPregnant ? 'default' : 'outline'} type="button" onClick={() => setIsPregnant(true)}>Yes</Button>
                <Button variant={isPregnant === false ? 'default' : 'outline'} type="button" onClick={() => { setIsPregnant(false); setTrackingType('period') }}>No</Button>
              </div>
              {isPregnant ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="12"
                    max="60"
                    placeholder="Age"
                    title="Age"
                    className="w-full rounded-lg border border-input px-4 py-2"
                  />
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    min="20"
                    max="250"
                    placeholder="Weight (kg)"
                    title="Weight in kilograms"
                    className="w-full rounded-lg border border-input px-4 py-2"
                  />
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    min="80"
                    max="220"
                    placeholder="Height (cm)"
                    title="Height in centimeters"
                    className="w-full rounded-lg border border-input px-4 py-2"
                  />
                  <input
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    placeholder="Existing conditions (optional)"
                    title="Existing conditions"
                    className="w-full rounded-lg border border-input px-4 py-2"
                  />
                  <input
                    type="date"
                    value={pregnancyStartDate}
                    onChange={(e) => setPregnancyStartDate(e.target.value)}
                    className="w-full rounded-lg border border-input px-4 py-2"
                  />
                  <input
                    type="number"
                    value={pregnancyWeek}
                    onChange={(e) => setPregnancyWeek(e.target.value)}
                    placeholder="Current week"
                    min="1"
                    max="40"
                    className="w-full rounded-lg border border-input px-4 py-2"
                  />
                  <input
                    type="number"
                    value={pregnancyMonth}
                    onChange={(e) => setPregnancyMonth(e.target.value)}
                    placeholder="Or current month (1-9)"
                    min="1"
                    max="9"
                    className="w-full rounded-lg border border-input px-4 py-2"
                  />
                </div>
              ) : null}
              <div className="flex gap-4">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white"
                >
                  {loading ? 'Setting up...' : 'Get Started'}
                </Button>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
