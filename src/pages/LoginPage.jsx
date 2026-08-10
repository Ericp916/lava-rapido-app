import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await login(username, password)
    if (authError) setError(authError.message || 'Login ou senha inválidos.')
    setLoading(false)
  }

  return <div className="min-h-screen bg-[#0b1f3a] px-5 py-10 text-white">
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
      <div className="mb-8"><p className="text-sm font-bold uppercase tracking-[.22em] text-blue-200">Gestão</p><h1 className="mt-2 text-4xl font-black">Lava Rápido</h1><p className="mt-2 text-blue-100">Atendimentos e pagamentos no celular.</p></div>
      <form onSubmit={submit} className="rounded-[2rem] bg-white p-5 text-slate-900 shadow-2xl">
        <label className="label" htmlFor="username">Login</label>
        <input
          id="username"
          className="input lowercase"
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          value={username}
          onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
          placeholder="seu.login"
          required
        />
        <label className="label mt-4" htmlFor="password">Senha</label>
        <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        {error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        <button className="btn-primary mt-5" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  </div>
}
