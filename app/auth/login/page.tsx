'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Playfair_Display } from 'next/font/google'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { LanguageSwitcher } from '@/components/language-switcher'

const brandFont = Playfair_Display({ subsets: ['latin'], weight: ['700'] })

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const { t } = useI18n()
  const a = t.auth

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || t.errors.sign_in_failed)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 p-4 sm:p-8">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/60 bg-white/70 shadow-2xl backdrop-blur-md lg:min-h-[78vh] lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden lg:block">
          <img
            src="https://th.bing.com/th/id/R.88ccab5716292a9627fdff4c2f7dd6ba?rik=lCl0wNwxNbyVVw&pid=ImgRaw&r=0"
            alt="Mother smiling in a calm setting"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-pink-700/30 to-purple-800/50" />
          <div className="absolute bottom-10 left-10 max-w-md text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">Yemama Care</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight">
              Support for every step of your health journey
            </h2>
            <p className="mt-3 text-sm text-white/90">
              Track symptoms, book appointments, and get personalized insights with confidence.
            </p>
          </div>
        </aside>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-end">
                <LanguageSwitcher />
              </div>
              <h1 className={`${brandFont.className} mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-5xl font-bold tracking-wide text-transparent sm:text-6xl`}>
                {t.app_name}
              </h1>
              <p className="text-lg text-muted-foreground">{a.login_title}</p>
            </div>

            <Card className="border-0 p-6 shadow-lg">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{a.email}</label>
                  <Input type="email" placeholder={a.email_placeholder} value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 w-full" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">{a.password}</label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 w-full" />
                </div>
                {error && (
                  <div className="rounded-lg border border-red-300 bg-red-100 p-3 text-sm text-red-800">{error}</div>
                )}
                <Button type="submit" className="h-12 w-full rounded-full bg-gradient-to-r from-primary to-accent font-semibold text-white transition-all hover:opacity-90" disabled={loading}>
                  {loading ? a.signing_in : a.sign_in}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                {a.no_account}{' '}
                <Link href="/auth/signup" className="font-semibold text-primary hover:underline">{a.sign_up}</Link>
              </div>
            </Card>
            <div className="mt-8 text-center text-sm text-muted-foreground">
              <p>{a.tagline}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
