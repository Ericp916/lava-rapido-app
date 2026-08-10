import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return response({ error: 'Método não permitido.' }, 405)

  try {
    const { login = '', password = '' } = await req.json()
    const normalizedLogin = String(login).trim().toLowerCase()

    if (!/^[a-z0-9._-]{3,30}$/.test(normalizedLogin) || !password) {
      return response({ error: 'Login ou senha inválidos.' }, 401)
    }

    const url = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!url || !serviceKey || !anonKey) {
      console.error('Variáveis internas do Supabase ausentes na Edge Function.')
      return response({ error: 'Falha de configuração do servidor.' }, 500)
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: perfil, error: profileError } = await admin
      .from('perfis')
      .select('id, ativo')
      .eq('login', normalizedLogin)
      .maybeSingle()

    if (profileError) {
      console.error('Erro ao localizar perfil:', profileError)
      return response({ error: 'Não foi possível realizar o login.' }, 500)
    }

    if (!perfil?.id || !perfil.ativo) {
      return response({ error: 'Login ou senha inválidos.' }, 401)
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(perfil.id)
    const email = userData?.user?.email

    if (userError || !email) {
      console.error('Usuário do Auth não localizado:', userError)
      return response({ error: 'Login ou senha inválidos.' }, 401)
    }

    // Cliente separado para autenticar a senha sem expor a service_role ao navegador.
    const authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password: String(password),
    })

    if (signInError || !data.session) {
      return response({ error: 'Login ou senha inválidos.' }, 401)
    }

    return response({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
  } catch (error) {
    console.error(error)
    return response({ error: 'Não foi possível realizar o login.' }, 500)
  }
})
