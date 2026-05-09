'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MODE_STORAGE_KEY } from '@/components/mode-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) throw loginError

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleAnonymous = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: anonError } = await supabase.auth.signInAnonymously()
      if (anonError) throw anonError

      const localMode = window.localStorage.getItem(MODE_STORAGE_KEY)
      await supabase.from('user_profiles').upsert({
        user_id: data.user?.id,
        tracking_type: localMode === 'pregnancy' ? 'pregnancy' : 'period',
      }, { onConflict: 'user_id' })

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Anonymous mode is unavailable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-4xl font-bold text-transparent">yemama</h1>
          <p className="text-lg text-muted-foreground">Welcome back</p>
        </div>

        <Card className="border-0 p-6 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>

            {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent text-white">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Button type="button" variant="outline" onClick={handleAnonymous} disabled={loading} className="mt-3 w-full">
            Continue in Anonymous Mode
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account? <Link href="/auth/signup" className="font-semibold text-primary hover:underline">Sign up</Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
