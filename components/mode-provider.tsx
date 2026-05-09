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

function isMode(value: string | null): value is Mode {
  return value === 'cycle' || value === 'pregnancy'
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
        if (typeof window !== 'undefined') {
          const localMode = window.localStorage.getItem(MODE_STORAGE_KEY)
          if (isMode(localMode)) {
            setModeState(localMode)
          }
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
          if (typeof window !== 'undefined') {
            if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODE_STORAGE_KEY, nextMode)
    }
          }
        } else {
          const { data: userPreference } = await supabase
            .from('users')
            .select('tracking_type')
            .eq('id', user.id)
            .maybeSingle<{ tracking_type: string | null }>()

          if (userPreference?.tracking_type) {
            const nextMode = fromTrackingType(userPreference.tracking_type)
            setModeState(nextMode)
            if (typeof window !== 'undefined') {
              if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODE_STORAGE_KEY, nextMode)
    }
            }
          }
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
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODE_STORAGE_KEY, nextMode)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return
    }

    const trackingType = toTrackingType(nextMode)

    await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        tracking_type: trackingType,
      }, {
        onConflict: 'user_id',
      })

    await supabase
      .from('users')
      .upsert({
        id: user.id,
        tracking_type: trackingType,
      }, {
        onConflict: 'id',
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
