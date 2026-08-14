import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function UserIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.1a7.5 7.5 0 0 1 15 0" />
  </svg>
}

function LockIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 10.5V7.875a4.5 4.5 0 0 1 9 0V10.5m-10.125 0h11.25A1.875 1.875 0 0 1 19.5 12.375v6.75A1.875 1.875 0 0 1 17.625 21H6.375A1.875 1.875 0 0 1 4.5 19.125v-6.75A1.875 1.875 0 0 1 6.375 10.5Z" />
  </svg>
}

function ArrowIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-5-5 5 5-5 5" />
  </svg>
}

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

  return <div className="login-shell">
    <div className="login-bg-media" aria-hidden="true" />
    <main className="login-stage">
      <form onSubmit={submit} className="login-card">
        <header className="login-brand">
          <span className="login-chip">Gestão</span>
          <h1 className="login-title">Lava Rápido</h1>
          <p className="login-subtitle">Atendimentos e pagamentos no celular.</p>
        </header>

        <div className="login-fields">
          <div className="login-field-group">
            <label className="login-label" htmlFor="username">Login</label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><UserIcon /></span>
              <input
                id="username"
                className="login-input lowercase"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="seu.login"
                required
              />
            </div>
          </div>

          <div className="login-field-group">
            <label className="login-label" htmlFor="password">Senha</label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><LockIcon /></span>
              <input
                id="password"
                className="login-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <button className="login-button" disabled={loading}>
          <span>{loading ? 'Entrando...' : 'Entrar'}</span>
          {!loading && <span className="login-button-icon"><ArrowIcon /></span>}
        </button>
      </form>
    </main>
  </div>
}
