import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { currency, dateTime, formatDateKey, formatPlate, localDateKey, periodRange } from '../lib/format'
import StatCard from '../components/StatCard'
import Loading from '../components/Loading'

export default function ReportsPage() {
  const [period, setPeriod] = useState('daily')
  const [items, setItems] = useState(null)
  const [received, setReceived] = useState(0)
  const [expenses, setExpenses] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { load() }, [period])

  async function load() {
    setItems(null)
    setError('')
    const { start, end } = periodRange(period)
    const startDate = localDateKey(new Date(start))
    const endDate = localDateKey(new Date(end))
    const [servicesRes, paidRes, expensesRes] = await Promise.all([
      supabase.from('vw_atendimentos_detalhes').select('*').gte('data_cadastro', start).lte('data_cadastro', end).order('data_cadastro', { ascending: false }),
      supabase.from('atendimentos').select('valor').eq('status_pagamento', 'pago').gte('data_pagamento', start).lte('data_pagamento', end),
      supabase.from('saidas').select('id,justificativa,valor,data_saida,usuario_nome,usuario_login').gte('data_saida', startDate).lte('data_saida', endDate).order('data_saida', { ascending: false }),
    ])

    if (servicesRes.error || paidRes.error || expensesRes.error) {
      setError('Não foi possível carregar o relatório completo.')
    }
    setItems(servicesRes.data || [])
    setReceived((paidRes.data || []).reduce((s, x) => s + Number(x.valor), 0))
    setExpenses(expensesRes.data || [])
  }

  if (!items) return <Loading />
  const billed = items.reduce((s, x) => s + Number(x.valor), 0)
  const pending = items.filter(x => x.status_pagamento === 'pendente').reduce((s, x) => s + Number(x.valor), 0)
  const expenseTotal = expenses.reduce((s, x) => s + Number(x.valor), 0)
  const balance = received - expenseTotal

  function exportXlsx() {
    const label = period === 'daily' ? 'Diário' : period === 'weekly' ? 'Semanal' : 'Mensal'
    const summary = [
      ['Relatório', label], ['Gerado em', new Date().toLocaleString('pt-BR')], ['Veículos atendidos', items.length],
      ['Valor faturado', billed], ['Valor recebido', received], ['Valor pendente', pending], ['Total de saídas', expenseTotal], ['Saldo do período', balance],
    ]
    const details = items.map(x => ({
      Data: dateTime.format(new Date(x.data_cadastro)), Cliente: x.cliente_nome, Telefone: x.telefone,
      Veículo: x.veiculo, Placa: formatPlate(x.placa), 'Descrição do serviço': x.descricao_servico || '', Valor: Number(x.valor), 'Forma de pagamento': x.forma_pagamento,
      Status: x.status_pagamento,
    }))
    const expenseDetails = expenses.map(x => ({
      Data: formatDateKey(x.data_saida), Justificativa: x.justificativa, Valor: Number(x.valor),
      Responsável: x.usuario_nome, Login: x.usuario_login,
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Resumo')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(details), 'Atendimentos')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseDetails), 'Saídas')
    XLSX.writeFile(wb, `relatorio-lava-rapido-${period}.xlsx`)
  }

  return <>
    <div className="grid grid-cols-3 gap-2"><Period label="Diário" active={period === 'daily'} onClick={() => setPeriod('daily')} /><Period label="Semanal" active={period === 'weekly'} onClick={() => setPeriod('weekly')} /><Period label="Mensal" active={period === 'monthly'} onClick={() => setPeriod('monthly')} /></div>
    {error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
    <div className="mt-5 grid grid-cols-2 gap-3">
      <StatCard label="Veículos" value={String(items.length)} />
      <StatCard label="Faturado" value={currency.format(billed)} />
      <StatCard label="Recebido" value={currency.format(received)} tone="green" />
      <StatCard label="Pendente" value={currency.format(pending)} tone="amber" />
      <StatCard label="Saídas" value={currency.format(expenseTotal)} tone="red" />
      <StatCard label="Saldo" value={currency.format(balance)} tone={balance >= 0 ? 'green' : 'red'} />
    </div>
    <button onClick={exportXlsx} className="btn-primary mt-5">Exportar Excel (.xlsx)</button>
    <p className="mt-3 text-xs leading-5 text-slate-500">Recebido considera a data real do pagamento. Faturado e pendente consideram os atendimentos cadastrados no período. Saídas consideram a data informada no lançamento. Saldo = recebido − saídas.</p>
  </>
}
function Period({ label, active, onClick }) { return <button onClick={onClick} className={`min-h-11 rounded-2xl text-sm font-bold ${active ? 'bg-[#0b1f3a] text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{label}</button> }
