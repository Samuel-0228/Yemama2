'use client'

import { FormEvent, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AppBottomNav } from '@/components/app-bottom-nav'
import { AppNavbar } from '@/components/app-navbar'
import { useMode } from '@/components/mode-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
}

type SymptomSummaryRow = {
  symptom_name: string
  date: string
}

export default function AssistantPage() {
  const supabase = createClient()
  const { mode, userId } = useMode()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hi, I am your AI health assistant. I can answer questions about periods, pregnancy, and symptoms. I am not a doctor and cannot diagnose conditions.',
    },
  ])
  const [loading, setLoading] = useState(false)
  const [contextSummary, setContextSummary] = useState('No logs yet')

  useEffect(() => {
    const loadContext = async () => {
      if (!userId) return

      const { data } = await supabase
        .from('symptoms')
        .select('symptom_name,date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(3)

      if (!data || data.length === 0) {
        setContextSummary('No recent symptoms logged')
        return
      }

      const summary = (data as SymptomSummaryRow[]).map((item) => `${item.symptom_name} on ${item.date}`).join('; ')
      setContextSummary(summary)
    }

    void loadContext()
  }, [supabase, userId])

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setLoading(true)
    setMessages((prev) => [...prev, { role: 'user', text: question }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          mode,
          contextSummary,
        }),
      })

      const result = (await response.json()) as { answer?: string; error?: string }
      setMessages((prev) => [...prev, { role: 'assistant', text: result.answer ?? result.error ?? 'I could not respond right now.' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Network issue. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppNavbar title="AI Health Assistant" subtitle="Non-diagnostic guidance with safety-first recommendations" />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        <Card className="border-0 bg-amber-50 p-4 text-sm text-amber-900">
          Safety disclaimer: This assistant is informational only, not medical diagnosis or emergency care. For urgent symptoms, contact a licensed clinician.
        </Card>

        <Card className="border-0 p-4 text-sm text-muted-foreground">
          Personalization context: {contextSummary}
        </Card>

        <Card className="border-0 p-4">
          <div className="space-y-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-2xl px-4 py-3 text-sm ${message.role === 'assistant' ? 'bg-purple-50 text-foreground' : 'bg-pink-100 text-foreground'}`}
              >
                {message.text}
              </div>
            ))}
          </div>
        </Card>

        <form onSubmit={sendMessage} className="flex gap-2">
          <Input placeholder={mode === 'cycle' ? 'Ask about period symptoms...' : 'Ask about pregnancy week symptoms...'} value={input} onChange={(event) => setInput(event.target.value)} />
          <Button disabled={loading}>{loading ? 'Sending...' : 'Send'}</Button>
        </form>
      </main>

      <AppBottomNav />
    </div>
  )
}
