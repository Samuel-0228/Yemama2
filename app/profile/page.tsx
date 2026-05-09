'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AppBottomNav } from '@/components/app-bottom-nav'
import { AppNavbar } from '@/components/app-navbar'
import { useMode } from '@/components/mode-provider'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

type ProfileRow = {
  full_name: string | null
  tracking_type: 'period' | 'pregnancy' | null
}

function isProfileRow(value: unknown): value is ProfileRow {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { full_name?: unknown; tracking_type?: unknown }
  const tracking = candidate.tracking_type
  return (typeof candidate.full_name === 'string' || candidate.full_name === null || candidate.full_name === undefined)
    && (tracking === 'period' || tracking === 'pregnancy' || tracking === null || tracking === undefined)
}

export default function ProfilePage() {
  const supabase = createClient()
  const { mode } = useMode()
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [pinEnabled, setPinEnabled] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  useEffect(() => {
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setEmail(user?.email ?? 'Anonymous user')

      if (user?.id) {
        const { data } = await supabase
          .from('user_profiles')
          .select('full_name,tracking_type')
          .eq('user_id', user.id)
          .maybeSingle()

        setProfile(isProfileRow(data) ? data : null)
      }
    }

    void run()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppNavbar title="Profile & Privacy" subtitle="Control your account, data safety, and lock settings" />

      <main className="mx-auto grid w-full max-w-4xl gap-4 px-4 py-6">
        <Card className="border-0 p-5">
          <p className="text-xs text-muted-foreground">Account</p>
          <h2 className="text-xl font-bold">{profile?.full_name ?? 'Welcome to yemama'}</h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          <p className="mt-2 inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
            Active mode: {mode === 'cycle' ? 'Cycle Mode' : 'Pregnancy Mode'}
          </p>
        </Card>

        <Card className="border-0 p-5">
          <h3 className="font-semibold">Privacy & Safety</h3>
          <p className="mt-1 text-sm text-muted-foreground">Encrypted data storage, secure auth, and private user-scoped records.</p>
          <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">PIN Lock UI</span>
              <Switch checked={pinEnabled} onCheckedChange={setPinEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Biometric Lock UI</span>
              <Switch checked={biometricEnabled} onCheckedChange={setBiometricEnabled} />
            </div>
            <p className="text-xs text-muted-foreground">These toggles represent client lock preferences and can be connected to native biometric APIs.</p>
          </div>
        </Card>

        <Card className="border-0 p-5">
          <h3 className="font-semibold">Support</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/"><Button variant="outline">About</Button></Link>
            <Link href="/"><Button variant="outline">Privacy</Button></Link>
            <Link href="/"><Button variant="outline">Contact</Button></Link>
            <Button variant="outline" onClick={handleLogout}>Sign Out</Button>
          </div>
        </Card>
      </main>

      <AppBottomNav />
    </div>
  )
}
