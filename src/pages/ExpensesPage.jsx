import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { currency, formatDateKey, localDateKey, parseMoneyInput, sanitizeMoneyInput } from '../lib/format'
import StatCard from '../components/StatCard'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'

const emptyForm = () => ({ justificativa: '', valor: '', data_saida: localDateKey() })

export default function ExpensesPage() {
  const { profile } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [items, setItems] = useState(null)
  const [summary, setSummary] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setError('')
    const today = localDateKey()
    const [listRes, todayRes, generalRes] = await Promise.all([
      supabase.from('saidas').select('id,justificativa,valor,data_saida,usuario_nome,usuario_login,criado_em').order('data_saida', { ascending: false }).order('criado_em', { ascending: false }).limit(100),
      supabase.rpc('resumo_caixa', { p_data_inicio: today, p_data_fim: today }),
      supabase.rpc('resumo_caixa', { p_data_inicio: null, p_data_fim: null }),
    ])

    if (listRes.error || todayRes.error || generalRes.error) {
      setError('Não foi possível carregar as saídas e o saldo do caixa.')
      setItems(listRes.data || [])
      return
    }

    const todayData = todayRes.data?.[0] || { recebido: 0, saidas: 0, saldo: 0 }
    const generalData = generalRes.data?.[0] || { recebido: 0, saidas: 0, saldo: 0 }
    setItems(listRes.data || [])
    setSummary({
      recebidoHoje: Number(todayData.recebido || 0),
      saidasHoje: Number(todayData.saidas || 0),
      saldoHoje: Number(todayData.saldo || 0),
      saldoGeral: Number(generalData.saldo || 0),
    })
  }

  function update(key, value) {
    setForm(current => ({ ...current, [key]: value }))
  }

  async function submit(e) {
    e.preventDefault()
    setMessage('')
    setError('')

    const value = parseMoneyInput(form.valor)
    const reason = form.justificativa.trim()
    if (reason.length < 3) { setError('Informe uma justificativa com pelo menos 3 caracteres.'); return }
    if (!value || value <= 0) { setError('Informe um valor de saída maior que zero.'); return }
    if (!form.data_saida) { setError('Informe a data da saída.'); return }

    setSaving(true)
    const { error: insertError } = await supabase.from('saidas').insert({
      justificativa: reason,
      valor: value,
      data_saida: form.data_saida,
    })
    setSaving(false)

    if (insertError) {
      setError('Não foi possível registrar a saída.')
      return
    }

    setForm(emptyForm())
    setMessage('Saída registrada com sucesso.')
    await load()
  }

  if (!items && !error) return <Loading label="Carregando caixa..." />

  const numericValue = parseMoneyInput(form.valor)

  return <div className="space-y-5">
    {summary && <div className="grid grid-cols-2 gap-3">
      <StatCard label="Recebido hoje" value={currency.format(summary.recebidoHoje)} tone="green" />
      <StatCard label="Saídas hoje" value={currency.format(summary.saidasHoje)} tone="red" />
      <StatCard label="Saldo hoje" value={currency.format(summary.saldoHoje)} tone={summary.saldoHoje >= 0 ? 'green' : 'red'} />
      <StatCard label="Saldo geral" value={currency.format(summary.saldoGeral)} tone={summary.saldoGeral >= 0 ? 'blue' : 'red'} />
    </div>}

    <form onSubmit={submit} className="card space-y-4">
      <div>
        <h2 className="text-lg font-black text-[#0b1f3a]">Nova saída</h2>
        <p className="mt-1 text-xs text-slate-500">A saída reduz o caixa geral, mas não altera o faturamento dos atendimentos.</p>
      </div>

      <div>
        <label className="label">Justificativa</label>
        <input className="input" value={form.justificativa} onChange={e => update('justificativa', e.target.value)} placeholder="Ex.: Produtos de limpeza" maxLength={120} required />
      </div>

      <div>
        <label className="label">Valor da saída</label>
        <div className="flex w-full items-center rounded-2xl border border-slate-200 bg-white transition focus-within:border-blue-700 focus-within:ring-4 focus-within:ring-blue-100">
          <span className="shrink-0 pl-4 pr-2 text-base font-bold text-slate-500">R$</span>
          <input
            className="min-w-0 flex-1 bg-transparent py-3.5 pr-4 text-base outline-none"
            type="text"
            inputMode="decimal"
            value={form.valor}
            onChange={e => update('valor', sanitizeMoneyInput(e.target.value))}
            onWheel={e => e.currentTarget.blur()}
            placeholder="0,00"
            autoComplete="off"
            required
          />
        </div>
        {numericValue > 0 && <p className="mt-1 text-xs text-slate-500">{currency.format(numericValue)}</p>}
      </div>

      <div>
        <label className="label">Data da saída</label>
        <input className="input" type="date" value={form.data_saida} onChange={e => update('data_saida', e.target.value)} required />
      </div>

      <div className="rounded-2xl bg-blue-50 p-3 text-xs font-semibold text-blue-800">
        Responsável pelo lançamento: <strong>{profile?.nome || profile?.login || 'Usuário atual'}</strong>. Essa informação será registrada automaticamente.
      </div>

      {error && <div className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
      {message && <div className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}
      <button className="btn-primary" disabled={saving}>{saving ? 'Registrando...' : 'Registrar saída'}</button>
    </form>

    <section>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#0b1f3a]">Histórico de saídas</h2>
          <p className="text-xs text-slate-500">Últimos 100 lançamentos</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{items?.length || 0}</span>
      </div>

      <div className="space-y-3">
        {(items || []).map(item => <article key={item.id} className="card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-900">{item.justificativa}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{formatDateKey(item.data_saida)}</p>
              <p className="mt-1 text-xs text-slate-500">Responsável: <span className="font-semibold text-slate-700">{item.usuario_nome}</span>{item.usuario_login ? ` (${item.usuario_login})` : ''}</p>
            </div>
            <p className="shrink-0 text-base font-black text-red-700">- {currency.format(Number(item.valor))}</p>
          </div>
        </article>)}

        {items?.length === 0 && <div className="card text-center">
          <p className="text-sm font-bold text-slate-700">Nenhuma saída registrada.</p>
          <p className="mt-1 text-xs text-slate-500">Os gastos lançados aparecerão aqui.</p>
        </div>}
      </div>
    </section>
  </div>
}
