import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabasePublicKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabasePublicKey) {
  console.warn('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.')
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabasePublicKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
