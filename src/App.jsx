import { useAuth } from './context/AuthContext'
import { useHashRoute } from './hooks/useHashRoute'
import Layout from './components/Layout'
import Loading from './components/Loading'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NewServicePage from './pages/NewServicePage'
import PendingPage from './pages/PendingPage'
import HistoryPage from './pages/HistoryPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import ExpensesPage from './pages/ExpensesPage'

const pages = {
  dashboard: ['Dashboard', DashboardPage],
  novo: ['Novo Atendimento', NewServicePage],
  pendentes: ['Pendentes', PendingPage],
  saidas: ['Saídas', ExpensesPage],
  historico: ['Histórico', HistoryPage],
  relatorios: ['Relatórios', ReportsPage],
  usuarios: ['Usuários', UsersPage],
}

export default function App() {
  const { session, loading, isAdmin } = useAuth()
  const route = useHashRoute('dashboard')

  if (loading) return <div className="min-h-screen bg-white"><Loading label="Abrindo sistema..." /></div>
  if (!session) return <LoginPage />

  const safeRoute = pages[route] ? route : 'dashboard'
  const [title, Page] = pages[safeRoute]

  if (safeRoute === 'usuarios' && !isAdmin) {
    return <Layout route="dashboard" title="Acesso restrito">
      <div className="card text-center">
        <p className="text-base font-black text-slate-900">Área exclusiva do administrador.</p>
        <p className="mt-2 text-sm text-slate-500">Seu usuário não possui permissão para gerenciar acessos.</p>
      </div>
    </Layout>
  }

  return <Layout route={safeRoute} title={title}><Page /></Layout>
}
