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

function normalizeLogin(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function validLogin(value: string) {
  return /^[a-z0-9._-]{3,30}$/.test(value)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return response({ error: 'Método não permitido.' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '')

    if (!url || !serviceKey || !anonKey || !token) {
      return response({ error: 'Não autorizado.' }, 401)
    }

    const authClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: callerData, error: callerError } = await authClient.auth.getUser(token)
    const caller = callerData?.user
    if (callerError || !caller) return response({ error: 'Sessão inválida.' }, 401)

    const { data: callerProfile, error: callerProfileError } = await admin
      .from('perfis')
      .select('id, perfil, ativo')
      .eq('id', caller.id)
      .maybeSingle()

    if (callerProfileError || !callerProfile?.ativo || callerProfile.perfil !== 'admin') {
      return response({ error: 'Apenas o administrador pode gerenciar usuários.' }, 403)
    }

    const body = await req.json()
    const action = String(body?.action ?? '')

    if (action === 'list') {
      const { data, error } = await admin
        .from('perfis')
        .select('id,nome,login,perfil,ativo,criado_em,atualizado_em')
        .order('nome')
      if (error) throw error
      return response({ users: data ?? [] })
    }

    if (action === 'create') {
      const nome = String(body?.nome ?? '').trim()
      const login = normalizeLogin(body?.login)
      const password = String(body?.password ?? '')

      if (nome.length < 2) return response({ error: 'Informe o nome do usuário.' }, 400)
      if (!validLogin(login)) return response({ error: 'O login deve ter de 3 a 30 caracteres e usar apenas letras, números, ponto, hífen ou underline.' }, 400)
      if (password.length < 8) return response({ error: 'A senha deve ter pelo menos 8 caracteres.' }, 400)

      const { data: existing } = await admin.from('perfis').select('id').eq('login', login).maybeSingle()
      if (existing) return response({ error: 'Esse login já está em uso.' }, 409)

      // E-mail técnico: nunca é exibido ou solicitado ao usuário.
      const technicalEmail = `${login}@usuarios.lavarapido.app`
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: technicalEmail,
        password,
        email_confirm: true,
        user_metadata: { nome, login },
      })

      if (createError || !created.user) {
        console.error(createError)
        const message = createError?.message?.toLowerCase().includes('already')
          ? 'Esse login já possui um usuário técnico no Auth.'
          : 'Não foi possível criar o usuário.'
        return response({ error: message }, 400)
      }

      const { data: profile, error: profileError } = await admin
        .from('perfis')
        .insert({
          id: created.user.id,
          nome,
          login,
          perfil: 'usuario',
          ativo: true,
        })
        .select('id,nome,login,perfil,ativo,criado_em,atualizado_em')
        .single()

      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id)
        console.error(profileError)
        return response({ error: 'Não foi possível concluir o cadastro do usuário.' }, 400)
      }

      return response({ user: profile }, 201)
    }

    if (action === 'update') {
      const id = String(body?.id ?? '')
      const nome = String(body?.nome ?? '').trim()
      const ativo = Boolean(body?.ativo)
      const password = String(body?.password ?? '')

      if (!id) return response({ error: 'Usuário inválido.' }, 400)
      if (nome.length < 2) return response({ error: 'Informe o nome do usuário.' }, 400)
      if (id === caller.id && !ativo) return response({ error: 'O administrador não pode desativar o próprio acesso.' }, 400)
      if (password && password.length < 8) return response({ error: 'A nova senha deve ter pelo menos 8 caracteres.' }, 400)

      const { data: target, error: targetError } = await admin
        .from('perfis')
.select('id,perfil,login')
        .eq('id', id)
        .maybeSingle()
      if (targetError || !target) return response({ error: 'Usuário não encontrado.' }, 404)

      // Não permite criar outro administrador nem remover o papel do administrador atual.
      const role = target.perfil === 'admin' ? 'admin' : 'usuario'

      const { data: updated, error: updateError } = await admin
        .from('perfis')
.update({ nome, login: target.login, ativo, perfil: role })
        .eq('id', id)
        .select('id,nome,login,perfil,ativo,criado_em,atualizado_em')
        .single()

      if (updateError) throw updateError

      if (password) {
        const { error: passwordError } = await admin.auth.admin.updateUserById(id, { password })
        if (passwordError) {
          console.error(passwordError)
          return response({ error: 'Dados salvos, mas não foi possível alterar a senha.' }, 400)
        }
      }

      return response({ user: updated })
    }

    return response({ error: 'Ação inválida.' }, 400)
  } catch (error) {
    console.error(error)
    return response({ error: 'Erro interno ao gerenciar usuários.' }, 500)
  }
})
