import { createBrowserClient } from '@supabase/ssr'

function resolveSupabaseCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url && anonKey) {
    return { url, anonKey }
  }

  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1') {
    throw new Error('Supabase client env vars are missing.')
  }

  return {
    url: 'http://localhost:54321',
    anonKey: 'public-anon-key',
  }
}

export function createClient() {
  const { url, anonKey } = resolveSupabaseCredentials()
  return createBrowserClient(url, anonKey)
}
