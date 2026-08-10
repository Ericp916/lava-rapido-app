import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { currency, localDayRange } from '../lib/format'
import { navigate } from '../hooks/useHashRoute'
import StatCard from '../components/StatCard'
import Loading from '../components/Loading'
import { ChartIcon, ClockIcon, PlusIcon, SearchIcon, UsersIcon } from '../components/Icons'
import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { isAdmin } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { start, end } = localDayRange()
    const [services, payments] = await Promise.all([
      supabase.from('atendimentos').select('valor,status_pagamento').gte('data_cadastro', start).lte('data_cadastro', end),
      supabase.from('atendimentos').select('valor').eq('status_pagamento', 'pago').gte('data_pagamento', start).lte('data_pagamento', end),
    ])
    if (services.error || payments.error) { setError('Não foi possível carregar o resumo.'); return }
    const faturado = services.data.reduce((s, x) => s + Number(x.valor), 0)
    const pendente = services.data.filter(x => x.status_pagamento === 'pendente').reduce((s, x) => s + Number(x.valor), 0)
    const recebido = payments.data.reduce((s, x) => s + Number(x.valor), 0)
    setStats({ faturado, recebido, pendente })
  }

  if (!stats && !error) return <Loading />
  return <>
    {error && <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
    {stats && <div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><StatCard label="Faturado hoje" value={currency.format(stats.faturado)} /><StatCard label="Recebido hoje" value={currency.format(stats.recebido)} tone="green" /><StatCard label="Pendente hoje" value={currency.format(stats.pendente)} tone="amber" /></div>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <Action icon={PlusIcon} title="Novo Atendimento" subtitle="Cadastrar em poucos cliques" onClick={() => navigate('novo')} primary />
      <Action icon={ClockIcon} title="Pendentes" subtitle="Cobrar e registrar pagamentos" onClick={() => navigate('pendentes')} />
      <Action icon={SearchIcon} title="Histórico" subtitle="Buscar cliente ou veículo" onClick={() => navigate('historico')} />
      <Action icon={ChartIcon} title="Relatórios" subtitle="Diário, semanal e mensal" onClick={() => navigate('relatorios')} />
      {isAdmin && <Action icon={UsersIcon} title="Usuários" subtitle="Criar e gerenciar acessos" onClick={() => navigate('usuarios')} />}
    </div>
  </>
}

function Action({ icon: Icon, title, subtitle, onClick, primary }) {
  return <button onClick={onClick} className={`flex min-h-24 items-center gap-4 rounded-3xl p-4 text-left shadow-sm transition active:scale-[.99] ${primary ? 'bg-[#0b1f3a] text-white' : 'border border-slate-100 bg-white text-slate-900'}`}><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${primary ? 'bg-white/10' : 'bg-blue-50 text-blue-800'}`}><Icon /></span><span><span className="block text-base font-black">{title}</span><span className={`mt-1 block text-xs ${primary ? 'text-blue-100' : 'text-slate-500'}`}>{subtitle}</span></span></button>
}
