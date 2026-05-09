import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function resolveSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && anonKey) {
    return { url, anonKey }
  }

  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1') {
    throw new Error('Supabase server env vars are missing.')
  }

  return {
    url: 'http://localhost:54321',
    anonKey: 'PLACEHOLDER_ANON_KEY',
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = resolveSupabaseCredentials()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // ignored in server component context
        }
      },
    },
  })
}
