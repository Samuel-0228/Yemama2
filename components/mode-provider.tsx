'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'cycle' | 'pregnancy'

export const MODE_STORAGE_KEY = 'yemama_mode'

type ModeContextValue = {
  mode: Mode
  loading: boolean
  userId: string | null
  setMode: (nextMode: Mode) => Promise<void>
}

const ModeContext = createContext<ModeContextValue | null>(null)

type ProfileTrackingRow = {
  tracking_type: string | null
}

function fromTrackingType(value: string | null | undefined): Mode {
  return value === 'pregnancy' ? 'pregnancy' : 'cycle'
}

function toTrackingType(mode: Mode): 'period' | 'pregnancy' {
  return mode === 'pregnancy' ? 'pregnancy' : 'period'
}

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [mode, setModeState] = useState<Mode>('cycle')
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const hydrate = async () => {
      try {
        const localMode = window.localStorage.getItem(MODE_STORAGE_KEY) as Mode | null
        if (localMode === 'cycle' || localMode === 'pregnancy') {
          setModeState(localMode)
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!mounted) return

        if (!user) {
          setUserId(null)
          setLoading(false)
          return
        }

        setUserId(user.id)

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('tracking_type')
          .eq('user_id', user.id)
          .maybeSingle<ProfileTrackingRow>()

        if (!mounted) return

        if (profile?.tracking_type) {
          const nextMode = fromTrackingType(profile.tracking_type)
          setModeState(nextMode)
          window.localStorage.setItem(MODE_STORAGE_KEY, nextMode)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void hydrate()

    return () => {
      mounted = false
    }
  }, [supabase])

  const setMode = useCallback(async (nextMode: Mode) => {
    setModeState(nextMode)
    window.localStorage.setItem(MODE_STORAGE_KEY, nextMode)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return
    }

    await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        tracking_type: toTrackingType(nextMode),
      }, {
        onConflict: 'user_id',
      })
  }, [supabase])

  const value = useMemo<ModeContextValue>(() => ({
    mode,
    loading,
    userId,
    setMode,
  }), [loading, mode, setMode, userId])

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
}

export function useMode() {
  const context = useContext(ModeContext)
  if (!context) {
    throw new Error('useMode must be used within ModeProvider')
  }
  return context
}
