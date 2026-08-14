import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { currency, dateTime, formatPlate } from '../lib/format'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

export default function HistoryPage() {
  const [items, setItems] = useState(null)
  const [search, setSearch] = useState('')
  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('vw_atendimentos_detalhes').select('*').order('data_cadastro', { ascending: false }).limit(1000)
    setItems(data || [])
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return items || []
    return (items || []).filter(x => [x.cliente_nome, x.placa, formatPlate(x.placa), x.telefone, x.descricao_servico].some(v => String(v || '').toLowerCase().includes(q)))
  }, [items, search])

  if (!items) return <Loading />
  return <>
    <input className="input mb-4" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, placa, telefone ou serviço" />
    <div className="space-y-3">{filtered.length === 0 ? <EmptyState title="Nenhum atendimento encontrado" /> : filtered.map(item => <div key={item.id} className="card"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{item.cliente_nome}</h3><p className="text-sm text-slate-600">{item.veiculo} · <strong>{formatPlate(item.placa)}</strong></p><p className="text-sm text-slate-500">{item.telefone}</p>{item.descricao_servico && <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"><strong>Serviço:</strong> {item.descricao_servico}</p>}</div><span className={item.status_pagamento === 'pago' ? 'badge-paid' : 'badge-pending'}>{item.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}</span></div><div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3"><div className="text-xs text-slate-500"><p>Atendimento: {dateTime.format(new Date(item.data_cadastro))}</p>{item.data_pagamento && <p>Pagamento: {dateTime.format(new Date(item.data_pagamento))}</p>}</div><p className="font-black">{currency.format(Number(item.valor))}</p></div></div>)}</div>
  </>
}
