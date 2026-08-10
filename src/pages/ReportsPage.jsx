import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { currency, dateTime, formatPlate, periodRange } from '../lib/format'
import StatCard from '../components/StatCard'
import Loading from '../components/Loading'

export default function ReportsPage() {
  const [period, setPeriod] = useState('daily')
  const [items, setItems] = useState(null)
  const [received, setReceived] = useState(0)
  useEffect(() => { load() }, [period])

  async function load() {
    setItems(null)
    const { start, end } = periodRange(period)
    const [servicesRes, paidRes] = await Promise.all([
      supabase.from('vw_atendimentos_detalhes').select('*').gte('data_cadastro', start).lte('data_cadastro', end).order('data_cadastro', { ascending: false }),
      supabase.from('atendimentos').select('valor').eq('status_pagamento', 'pago').gte('data_pagamento', start).lte('data_pagamento', end),
    ])
    setItems(servicesRes.data || [])
    setReceived((paidRes.data || []).reduce((s, x) => s + Number(x.valor), 0))
  }

  if (!items) return <Loading />
  const billed = items.reduce((s, x) => s + Number(x.valor), 0)
  const pending = items.filter(x => x.status_pagamento === 'pendente').reduce((s, x) => s + Number(x.valor), 0)

  function exportXlsx() {
    const label = period === 'daily' ? 'Diário' : period === 'weekly' ? 'Semanal' : 'Mensal'
    const summary = [
      ['Relatório', label], ['Gerado em', new Date().toLocaleString('pt-BR')], ['Veículos atendidos', items.length],
      ['Valor faturado', billed], ['Valor recebido', received], ['Valor pendente', pending],
    ]
    const details = items.map(x => ({
      Data: dateTime.format(new Date(x.data_cadastro)), Cliente: x.cliente_nome, Telefone: x.telefone,
      Veículo: x.veiculo, Placa: formatPlate(x.placa), Valor: Number(x.valor), 'Forma de pagamento': x.forma_pagamento,
      Status: x.status_pagamento,
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Resumo')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(details), 'Atendimentos')
    XLSX.writeFile(wb, `relatorio-lava-rapido-${period}.xlsx`)
  }

  return <>
    <div className="grid grid-cols-3 gap-2"><Period label="Diário" active={period === 'daily'} onClick={() => setPeriod('daily')} /><Period label="Semanal" active={period === 'weekly'} onClick={() => setPeriod('weekly')} /><Period label="Mensal" active={period === 'monthly'} onClick={() => setPeriod('monthly')} /></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><StatCard label="Veículos" value={String(items.length)} /><StatCard label="Faturado" value={currency.format(billed)} /><StatCard label="Recebido" value={currency.format(received)} tone="green" /><StatCard label="Pendente" value={currency.format(pending)} tone="amber" /></div>
    <button onClick={exportXlsx} className="btn-primary mt-5">Exportar Excel (.xlsx)</button>
    <p className="mt-3 text-xs leading-5 text-slate-500">Recebido considera a data real do pagamento. Faturado e pendente consideram os atendimentos cadastrados no período selecionado.</p>
  </>
}
function Period({ label, active, onClick }) { return <button onClick={onClick} className={`min-h-11 rounded-2xl text-sm font-bold ${active ? 'bg-[#0b1f3a] text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{label}</button> }
