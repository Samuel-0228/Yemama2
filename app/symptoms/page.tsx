'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Plus } from 'lucide-react'
import { MobileNav } from '@/components/mobile-nav'

const SYMPTOMS = [
  { name: 'Cramps', emoji: '⚡' },
  { name: 'Headache', emoji: '🤕' },
  { name: 'Nausea', emoji: '🤢' },
  { name: 'Fatigue', emoji: '😴' },
  { name: 'Back pain', emoji: '🔙' },
  { name: 'Mood swings', emoji: '🎭' },
]

type SymptomStatus = 'Good' | 'Moderate' | 'Concerning'

type SymptomAnalysis = {
  status: SymptomStatus
  summary: string
  homeRemedies: string[]
  restAdvice: string[]
  seeDoctorWhen: string[]
}

export default function SymptomsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [custom, setCustom] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<any[]>([])
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null)

  const fetchRecent = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('symptoms').select('*').eq('user_id', user.id)
      .order('date', { ascending: false }).limit(10)
    if (data) setRecent(data)
  }

  useEffect(() => { fetchRecent() }, [])

  const toggle = (name: string) => {
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setSelected(next)
  }

  const analyze = (names: string[]): SymptomAnalysis => {
    const set = new Set(names)
    const count = set.size

    const homeRemedies: string[] = []
    const restAdvice: string[] = []
    const seeDoctorWhen: string[] = []

    if (set.has('Nausea')) {
      homeRemedies.push('Try small, frequent meals (dry toast/crackers) and sip water or ginger tea.')
      restAdvice.push('Avoid strong smells; rest after eating if you feel queasy.')
      seeDoctorWhen.push('Vomiting is persistent, you can’t keep fluids down, or you feel very weak.')
    }
    if (set.has('Headache')) {
      homeRemedies.push('Drink water, eat a small snack, and rest in a dark, quiet room.')
      restAdvice.push('Limit screens; try gentle neck/shoulder stretches.')
      seeDoctorWhen.push('Headache is severe, sudden, or comes with vision changes or swelling.')
    }
    if (set.has('Cramps')) {
      homeRemedies.push('Warm compress on the lower abdomen and gentle stretching can help.')
      restAdvice.push('Slow walking and hydration may reduce mild cramping.')
      seeDoctorWhen.push('Cramps are severe, worsening, or associated with bleeding, fever, or fainting.')
    }
    if (set.has('Back pain')) {
      homeRemedies.push('Use a pillow for support; try a warm shower and gentle posture breaks.')
      restAdvice.push('Avoid heavy lifting; rest with knees supported.')
      seeDoctorWhen.push('Back pain is severe, with fever, burning urination, or numbness/weakness.')
    }
    if (set.has('Fatigue')) {
      homeRemedies.push('Eat balanced meals with iron-rich foods (lentils, eggs, greens).')
      restAdvice.push('Short naps and a consistent bedtime help.')
      seeDoctorWhen.push('Fatigue is extreme, with dizziness, shortness of breath, or palpitations.')
    }
    if (set.has('Mood swings')) {
      homeRemedies.push('Talk to someone you trust; short walks and breathing exercises can help.')
      restAdvice.push('Sleep and regular meals reduce irritability for many people.')
      seeDoctorWhen.push('Mood feels overwhelming, persistent, or you feel unsafe.')
    }

    // Status logic (non-diagnostic): more symptoms → higher concern,
    // and some combos are more likely to need medical check-in.
    const concerningCombos =
      (set.has('Headache') && set.has('Back pain') && set.has('Fatigue')) ||
      (set.has('Cramps') && set.has('Nausea') && set.has('Fatigue'))

    const status: SymptomStatus =
      concerningCombos || count >= 4 ? 'Concerning' : count >= 2 ? 'Moderate' : 'Good'

    const summary =
      status === 'Good'
        ? 'These symptoms are common for many people. Use simple comfort steps and monitor changes.'
        : status === 'Moderate'
          ? 'You have a few symptoms together. Focus on rest, hydration, and comfort steps today.'
          : 'Several symptoms together can be harder on your body. If anything feels severe or unusual, contact a clinician.'

    // Always include clear safety-net guidance.
    seeDoctorWhen.unshift('If you have heavy bleeding, chest pain, trouble breathing, fainting, or severe pain—seek urgent care.')

    return {
      status,
      summary,
      homeRemedies: homeRemedies.length ? homeRemedies : ['Hydrate, eat something light, and take it easy today.'],
      restAdvice: restAdvice.length ? restAdvice : ['Rest when you can and reduce strenuous activity.'],
      seeDoctorWhen,
    }
  }

  const handleLog = async () => {
    const names = [...selected]
    if (custom.trim()) names.push(custom.trim())
    if (names.length === 0) { toast({ title: 'Pick at least one symptom 💛', variant: 'destructive' }); return }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('symptoms').insert(
        names.map(n => ({ user_id: user.id, date: new Date().toISOString().split('T')[0], symptom_name: n, intensity: 3, notes: notes || null }))
      )
      if (error) throw error
      setAnalysis(analyze(names))
      toast({ title: 'Logged! 🌸' })
      setOpen(false)
      setSelected(new Set())
      setCustom('')
      setNotes('')
      fetchRecent()
    } catch (err: any) {
      toast({ title: 'Oops!', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold">How are you feeling? 🩺</h1>
            <p className="text-xs text-muted-foreground">Tap to log your symptoms</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Log button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="w-full rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 text-white py-5 text-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
              <Plus className="w-5 h-5" /> Log how I feel
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg">What are you feeling? 💭</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {SYMPTOMS.map(({ name, emoji }) => (
                  <button
                    key={name}
                    onClick={() => toggle(name)}
                    className={`rounded-2xl p-3 text-center transition-all active:scale-95 border-2 ${
                      selected.has(name)
                        ? 'bg-purple-100 border-purple-400 shadow-sm'
                        : 'bg-gray-50 border-transparent'
                    }`}
                  >
                    <div className="text-2xl mb-1">{emoji}</div>
                    <p className="text-xs font-medium leading-tight">{name}</p>
                  </button>
                ))}
              </div>
              <input
                className="w-full rounded-2xl border border-input bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="✏️ Something else? Type it here..."
                value={custom}
                onChange={e => setCustom(e.target.value)}
              />
              <textarea
                className="w-full rounded-2xl border border-input bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                placeholder="📝 Any extra notes? (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button
                onClick={handleLog}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 font-bold text-base active:scale-95 transition-transform disabled:opacity-60"
              >
                {loading ? 'Saving... 🌸' : 'Log & get insights ✨'}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Analysis result */}
        {analysis && (
          <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 space-y-4">
            <div>
              <p className="font-bold text-foreground mb-2">Your status</p>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    analysis.status === 'Good'
                      ? 'bg-emerald-100 text-emerald-700'
                      : analysis.status === 'Moderate'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                  }`}
                >
                  {analysis.status}
                </span>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              </div>
            </div>
            <div>
              <p className="font-bold text-foreground mb-2">Home remedies</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {analysis.homeRemedies.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-bold text-foreground mb-2">When to rest</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {analysis.restAdvice.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
            <div>
              <p className="font-bold text-foreground mb-2">When to see a doctor</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {analysis.seeDoctorWhen.map((t, i) => <li key={i}>• {t}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-3 px-1">Recent logs</p>
            <div className="space-y-2">
              {recent.slice(0, 5).map((s, i) => {
                const sym = SYMPTOMS.find(x => x.name === s.symptom_name)
                return (
                  <div key={i} className="rounded-2xl bg-white border border-gray-100 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sym?.emoji || '🩺'}</span>
                      <div>
                        <p className="font-medium text-sm">{s.symptom_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <div key={n} className={`w-2 h-2 rounded-full ${n <= s.intensity ? 'bg-purple-400' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Emergency card */}
        <div className="rounded-3xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-100 p-5">
          <p className="font-bold text-red-600 mb-3">🚨 Go to the ER right away if you have:</p>
          <div className="grid grid-cols-2 gap-2">
            {['Heavy bleeding', 'Severe pain', 'No fetal movement', 'Sudden swelling', 'Fever 38°C+', 'Chest pain'].map(s => (
              <div key={s} className="bg-white/70 rounded-xl px-3 py-2 text-xs font-medium text-red-700">• {s}</div>
            ))}
          </div>
        </div>

      </div>
      <MobileNav active="symptoms" />
    </div>
  )
}
