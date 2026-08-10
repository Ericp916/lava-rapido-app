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

const pages = {
  dashboard: ['Dashboard', DashboardPage],
  novo: ['Novo Atendimento', NewServicePage],
  pendentes: ['Pendentes', PendingPage],
  historico: ['Histórico', HistoryPage],
  relatorios: ['Relatórios', ReportsPage],
}

export default function App() {
  const { session, loading } = useAuth()
  const route = useHashRoute('dashboard')
  if (loading) return <div className="min-h-screen bg-white"><Loading label="Abrindo sistema..." /></div>
  if (!session) return <LoginPage />
  const [title, Page] = pages[route] || pages.dashboard
  return <Layout route={pages[route] ? route : 'dashboard'} title={title}><Page /></Layout>
}
