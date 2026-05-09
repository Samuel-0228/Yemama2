'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const FOOD_CALORIES: Record<string, number> = {
  // Ethiopian staples (rough estimates per serving)
  injera: 180,
  shiro: 230,
  lentils: 190,
  misir: 190,
  tibs: 420,
  kitfo: 520,
  doro: 380,
  vegetables: 120,
  salad: 80,
  eggs: 80,
  milk: 150,
  yogurt: 180,
  banana: 105,
  apple: 95,
  bread: 90,
  rice: 200,
  pasta: 220,
}

function estimateCalories(foodText: string, portionText: string): { foodName: string; portion: string; calories: number } {
  const foodName = foodText.trim().toLowerCase()
  const portion = portionText.trim() || '1'
  const p = Number(portion) || 1

  // If exact match exists, use it. Otherwise, try substring match.
  const direct = FOOD_CALORIES[foodName]
  if (direct) return { foodName, portion, calories: Math.round(direct * p) }

  const key = Object.keys(FOOD_CALORIES).find((k) => foodName.includes(k))
  if (key) return { foodName, portion, calories: Math.round(FOOD_CALORIES[key] * p) }

  // Unknown food fallback
  return { foodName: foodName || 'meal', portion, calories: Math.round(350 * p) }
}

function classifyMeal(calories: number): { quality: 'good' | 'moderate' | 'needs_improvement'; suggestion: string } {
  // Practical, non-judgmental guidance
  if (calories >= 450 && calories <= 800) {
    return { quality: 'good', suggestion: 'Nice—try to include protein + vegetables. Add water or milk.' }
  }
  if (calories >= 250 && calories < 450) {
    return { quality: 'moderate', suggestion: 'Good start. Add a protein (eggs, lentils) or a fruit to balance it.' }
  }
  return { quality: 'needs_improvement', suggestion: 'This looks light. Add a protein or healthy snack (eggs, yogurt, lentils, fruit).' }
}

export default function NutritionPage() {
  const supabase = createClient()
  const [food, setFood] = useState('')
  const [portion, setPortion] = useState('1')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [recent, setRecent] = useState<any[]>([])

  const est = useMemo(() => estimateCalories(food, portion), [food, portion])
  const assessment = useMemo(() => classifyMeal(est.calories), [est.calories])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8)
      if (data) setRecent(data)
    }
    load()
  }, [])

  const saveFood = async () => {
    setMessage('')
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please login first.')
      if (!food.trim()) throw new Error('Please enter a food or meal name.')
      await supabase.from('food_logs').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        food_name: est.foodName,
        portion: est.portion,
        estimated_calories: est.calories,
        quality: assessment.quality,
      })
      setMessage(`Saved: ${est.calories} kcal (${assessment.quality.replace('_', ' ')}) • ${assessment.suggestion}`)

      const { data } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(8)
      if (data) setRecent(data)
    } catch (err: any) {
      setError(err?.message || 'Unable to save food log.')
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl space-y-4 px-4 py-6">
      <Card className="p-4">
        <h1 className="text-xl font-semibold">Nutrition Recommendations</h1>
        <p className="text-sm text-muted-foreground">
          Practical ideas: Injera + shiro, lentils (misir), eggs, vegetables, yogurt, fruit.
        </p>
      </Card>

      <Card className="space-y-3 p-4">
        <Input value={food} onChange={(e) => setFood(e.target.value)} placeholder="What did you eat? (e.g. injera with shiro)" />
        <Input value={portion} onChange={(e) => setPortion(e.target.value)} placeholder="Portion (1 = one serving, 1.5, 2...)" />
        <p className="text-sm text-muted-foreground">
          Estimated calories: <span className="font-semibold text-foreground">{est.calories}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Classification: <span className="font-semibold text-foreground">{assessment.quality.replace('_', ' ')}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Suggestion: <span className="font-semibold text-foreground">{assessment.suggestion}</span>
        </p>
        <Button onClick={saveFood}>Save food log</Button>
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold">Recent meals</p>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No meals logged yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.food_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(r.date).toLocaleDateString()} • portion {r.portion || '1'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{r.estimated_calories || 0} kcal</p>
                  <p className="text-xs text-muted-foreground">{String(r.quality || '').replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
