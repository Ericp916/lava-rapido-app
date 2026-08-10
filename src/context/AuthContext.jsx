import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabasePublicKey, supabaseUrl } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthLoading(false)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      if (!session?.user?.id) {
        setProfile(null)
        setProfileLoading(false)
        return
      }

      setProfileLoading(true)
      const { data, error } = await supabase
        .from('perfis')
        .select('id,nome,login,perfil,ativo')
        .eq('id', session.user.id)
        .maybeSingle()

      if (cancelled) return

      if (error || !data || !data.ativo) {
        setProfile(null)
        setProfileLoading(false)
        await supabase.auth.signOut()
        return
      }

      setProfile(data)
      setProfileLoading(false)
    }

    loadProfile()
    return () => { cancelled = true }
  }, [session?.user?.id])

  async function login(loginValue, password) {
    const loginName = String(loginValue || '').trim().toLowerCase()

    try {
      const request = await fetch(`${supabaseUrl}/functions/v1/auth-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabasePublicKey,
        },
        body: JSON.stringify({ login: loginName, password }),
      })

      const payload = await request.json().catch(() => ({}))
      if (!request.ok || !payload?.access_token || !payload?.refresh_token) {
        return { error: new Error(payload?.error || 'Login ou senha inválidos.') }
      }

      const { error } = await supabase.auth.setSession({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
      })
      return { error }
    } catch {
      return { error: new Error('Não foi possível conectar ao servidor de autenticação.') }
    }
  }

  const logout = () => supabase.auth.signOut()
  const refreshProfile = async () => {
    if (!session?.user?.id) return
    const { data } = await supabase.from('perfis').select('id,nome,login,perfil,ativo').eq('id', session.user.id).maybeSingle()
    if (data?.ativo) setProfile(data)
  }

  const value = useMemo(() => ({
    session,
    profile,
    isAdmin: profile?.perfil === 'admin' && profile?.ativo === true,
    loading: authLoading || (Boolean(session) && profileLoading),
    login,
    logout,
    refreshProfile,
  }), [session, profile, authLoading, profileLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
