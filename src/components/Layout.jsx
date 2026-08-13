import { useAuth } from '../context/AuthContext'
import { navigate } from '../hooks/useHashRoute'
import { CashOutIcon, ChartIcon, ClockIcon, HomeIcon, LogOutIcon, PlusIcon, SearchIcon } from './Icons'

const items = [
  ['dashboard', 'Início', HomeIcon],
  ['novo', 'Novo', PlusIcon],
  ['pendentes', 'Pendentes', ClockIcon],
  ['saidas', 'Saídas', CashOutIcon],
  ['historico', 'Histórico', SearchIcon],
  ['relatorios', 'Relatórios', ChartIcon],
]

export default function Layout({ route, title, children }) {
  const { logout, profile } = useAuth()
  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-24">
      <header className="safe-top sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">Lava Rápido</p>
            <h1 className="text-lg font-black text-[#0b1f3a]">{title}</h1>
            {profile?.nome && <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{profile.nome}</p>}
          </div>
          <button onClick={logout} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-700" aria-label="Sair"><LogOutIcon className="h-5 w-5" /></button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-1 pt-2 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-6 gap-0.5">
          {items.map(([key, label, Icon]) => {
            const active = route === key
            return <button key={key} onClick={() => navigate(key)} className={`flex min-h-14 min-w-0 flex-col items-center justify-center rounded-2xl px-0.5 text-[9px] font-bold ${active ? 'bg-blue-50 text-blue-800' : 'text-slate-500'}`}><Icon className="mb-1 h-5 w-5" /><span className="max-w-full truncate">{label}</span></button>
          })}
        </div>
      </nav>
    </div>
  )
}
