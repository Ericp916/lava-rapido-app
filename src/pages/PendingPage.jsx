import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { currency, formatPlate, whatsappUrl } from '../lib/format'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'
import { WhatsAppIcon } from '../components/Icons'

const MSG = 'Olá! Verificamos em nosso sistema que existe um valor pendente referente ao serviço realizado em seu veículo. Por favor, entre em contato conosco. Obrigado.'

export default function PendingPage() {
  const [items, setItems] = useState(null)
  const [search, setSearch] = useState('')
  const [working, setWorking] = useState(null)
  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('vw_atendimentos_detalhes').select('*').eq('status_pagamento', 'pendente').order('data_cadastro', { ascending: false })
    setItems(data || [])
  }

  async function markPaid(id) {
    setWorking(id)
    const { error } = await supabase.from('atendimentos').update({ status_pagamento: 'pago' }).eq('id', id)
    setWorking(null)
    if (!error) setItems(list => list.filter(x => x.id !== id))
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return items || []
    return (items || []).filter(x => [x.cliente_nome, x.placa, formatPlate(x.placa), x.telefone].some(v => String(v || '').toLowerCase().includes(q)))
  }, [items, search])

  if (!items) return <Loading />
  return <>
    <input className="input mb-4" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, placa ou telefone" />
    <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-800">Total pendente: {currency.format(filtered.reduce((s, x) => s + Number(x.valor), 0))}</div>
    <div className="space-y-3">{filtered.length === 0 ? <EmptyState title="Nenhuma pendência encontrada" /> : filtered.map(item => <div key={item.id} className="card"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-slate-900">{item.cliente_nome}</h3><p className="mt-1 text-sm text-slate-600">{item.veiculo} · <strong>{formatPlate(item.placa)}</strong></p><p className="text-sm text-slate-500">{item.telefone}</p></div><p className="shrink-0 font-black text-amber-700">{currency.format(Number(item.valor))}</p></div><div className="mt-4 grid grid-cols-2 gap-2"><a className="flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-sm font-bold text-white" href={whatsappUrl(item.telefone, MSG) || '#'} target="_blank" rel="noreferrer"><WhatsAppIcon className="h-5 w-5" /> WhatsApp</a><button onClick={() => markPaid(item.id)} disabled={working === item.id} className="min-h-11 rounded-2xl bg-[#0b1f3a] px-3 text-sm font-bold text-white disabled:opacity-60">{working === item.id ? 'Salvando...' : 'Marcar pago'}</button></div></div>)}</div>
  </>
}
