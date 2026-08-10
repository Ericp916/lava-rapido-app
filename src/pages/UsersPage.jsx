import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Loading from '../components/Loading'

const newUserEmpty = { nome: '', login: '', password: '', confirmPassword: '' }

function cleanLogin(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30)
}

export default function UsersPage() {
  const { session, profile, refreshProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(newUserEmpty)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)

  useEffect(() => { loadUsers() }, [])

  async function invoke(body) {
    const { data, error: fnError } = await supabase.functions.invoke('manage-users', {
      body,
      headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    })
    if (fnError) {
      let message = 'Não foi possível comunicar com a gestão de usuários.'
      try {
        const context = fnError.context
        if (context && typeof context.json === 'function') {
          const payload = await context.json()
          if (payload?.error) message = payload.error
        }
      } catch {}
      throw new Error(message)
    }
    if (data?.error) throw new Error(data.error)
    return data
  }

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const data = await invoke({ action: 'list' })
      setUsers(data?.users ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function updateForm(key, value) {
    setForm(current => ({ ...current, [key]: key === 'login' ? cleanLogin(value) : value }))
  }

  async function createUser(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem.')
      return
    }
    if (form.password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setSaving(true)
    try {
      await invoke({ action: 'create', nome: form.nome, login: form.login, password: form.password })
      setForm(newUserEmpty)
      setCreating(false)
      setSuccess('Usuário criado com sucesso.')
      await loadUsers()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(user) {
    setError('')
    setSuccess('')
    setEditingId(user.id)
    setEditForm({ nome: user.nome, ativo: user.ativo, password: '' })
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!editForm || !editingId) return
    setError('')
    setSuccess('')
    if (editForm.password && editForm.password.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    setSaving(true)
    try {
      await invoke({ action: 'update', id: editingId, ...editForm })
      const ownUser = editingId === profile?.id
      setEditingId(null)
      setEditForm(null)
      setSuccess('Usuário atualizado com sucesso.')
      await loadUsers()
      if (ownUser) await refreshProfile()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const activeCount = useMemo(() => users.filter(user => user.ativo).length, [users])

  if (loading) return <Loading label="Carregando usuários..." />

  return <div className="space-y-4">
    <div className="card flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-slate-500">Acessos cadastrados</p>
        <p className="mt-1 text-2xl font-black text-[#0b1f3a]">{users.length}</p>
        <p className="text-xs font-semibold text-emerald-700">{activeCount} ativo{activeCount === 1 ? '' : 's'}</p>
      </div>
      <button className="min-h-12 rounded-2xl bg-[#0b1f3a] px-5 font-bold text-white" onClick={() => { setCreating(value => !value); setError(''); setSuccess('') }}>
        {creating ? 'Cancelar' : '+ Novo usuário'}
      </button>
    </div>

    {error && <div className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
    {success && <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}</div>}

    {creating && <form onSubmit={createUser} className="card space-y-4">
      <div>
        <h2 className="text-lg font-black text-[#0b1f3a]">Novo usuário</h2>
        <p className="mt-1 text-xs text-slate-500">O usuário entrará somente com login e senha. Nenhum e-mail será solicitado.</p>
      </div>
      <Field label="Nome" value={form.nome} onChange={value => updateForm('nome', value)} placeholder="Ex.: João da Silva" autoComplete="off" />
      <Field label="Login" value={form.login} onChange={value => updateForm('login', value)} placeholder="Ex.: joao" autoCapitalize="none" autoComplete="off" />
      <Field label="Senha" value={form.password} onChange={value => updateForm('password', value)} type="password" placeholder="Mínimo de 8 caracteres" autoComplete="new-password" />
      <Field label="Confirmar senha" value={form.confirmPassword} onChange={value => updateForm('confirmPassword', value)} type="password" placeholder="Digite novamente" autoComplete="new-password" />
      <div className="rounded-2xl bg-blue-50 p-3 text-xs font-semibold text-blue-800">Perfil criado: <strong>Usuário</strong>. Somente você permanece como administrador.</div>
      <button className="btn-primary" disabled={saving}>{saving ? 'Criando...' : 'Criar usuário'}</button>
    </form>}

    <div className="space-y-3">
      {users.map(user => {
        const editing = editingId === user.id
        const isSelf = user.id === profile?.id
        return <div key={user.id} className="card">
          {!editing ? <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-black text-slate-900">{user.nome}</h3>
                  {user.perfil === 'admin' && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-800">Administrador</span>}
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${user.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{user.ativo ? 'Ativo' : 'Inativo'}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">Login: <span className="text-slate-800">{user.login}</span></p>
                {isSelf && <p className="mt-1 text-xs font-semibold text-blue-700">Seu acesso</p>}
              </div>
              <button onClick={() => startEdit(user)} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700">Editar</button>
            </div>
          </> : <form onSubmit={saveEdit} className="space-y-3">
            <h3 className="text-base font-black text-[#0b1f3a]">Editar usuário</h3>
            <Field label="Nome" value={editForm.nome} onChange={value => setEditForm(f => ({ ...f, nome: value }))} />
            <Field label="Nova senha (opcional)" value={editForm.password} onChange={value => setEditForm(f => ({ ...f, password: value }))} type="password" placeholder="Deixe vazio para manter a atual" autoComplete="new-password" required={false} />
            {user.perfil !== 'admin' && <label className="flex min-h-12 items-center justify-between rounded-2xl border border-slate-200 px-4">
              <span className="text-sm font-bold text-slate-700">Acesso ativo</span>
              <input type="checkbox" className="h-5 w-5 accent-blue-900" checked={editForm.ativo} onChange={e => setEditForm(f => ({ ...f, ativo: e.target.checked }))} />
            </label>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setEditForm(null) }}>Cancelar</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>}
        </div>
      })}
    </div>
  </div>
}

function Field({ label, value, onChange, type = 'text', placeholder = '', autoComplete, autoCapitalize, required = true }) {
  return <div>
    <label className="label">{label}</label>
    <input
      className="input"
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      autoCapitalize={autoCapitalize}
      required={required}
    />
  </div>
}
