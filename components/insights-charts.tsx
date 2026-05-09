'use client'

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { useMode } from '@/components/mode-provider'

const cycleData = [
  { name: 'Jan', consistency: 28, mood: 3, symptoms: 5 },
  { name: 'Feb', consistency: 27, mood: 4, symptoms: 4 },
  { name: 'Mar', consistency: 28, mood: 3, symptoms: 6 },
  { name: 'Apr', consistency: 29, mood: 2, symptoms: 5 },
]

const pregnancyData = [
  { name: 'W17', symptoms: 3, mood: 4 },
  { name: 'W18', symptoms: 2, mood: 4 },
  { name: 'W19', symptoms: 4, mood: 3 },
  { name: 'W20', symptoms: 2, mood: 4 },
]

export function InsightsCharts() {
  const { mode } = useMode()
  const insight = mode === 'cycle' ? 'Your cycle is regular. You often feel tired before your period.' : 'You are doing great in week 20. Fatigue spikes on busy weekdays.'

  return (
    <div className="space-y-4">
      <Card className="border-0 p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">AI Insight</p>
        <p className="text-sm text-muted-foreground">{insight}</p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 p-4">
          <h3 className="mb-3 text-sm font-semibold">{mode === 'cycle' ? 'Cycle Consistency' : 'Symptom Trend'}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mode === 'cycle' ? cycleData : pregnancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey={mode === 'cycle' ? 'consistency' : 'symptoms'} stroke="#d946ef" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-0 p-4">
          <h3 className="mb-3 text-sm font-semibold">Mood Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mode === 'cycle' ? cycleData : pregnancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="mood" fill="#a78bfa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
