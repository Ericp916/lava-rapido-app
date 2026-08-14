import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { currency, formatPlate, isValidPlate, normalizePlate, digitsOnly, parseMoneyInput, sanitizeMoneyInput } from '../lib/format'
import { navigate } from '../hooks/useHashRoute'

const empty = { placa: '', veiculo: '', nome: '', telefone: '', descricao_servico: '', valor: '', forma_pagamento: 'PIX', status_pagamento: 'pago' }

export default function NewServicePage() {
  const [form, setForm] = useState(empty)
  const [found, setFound] = useState(false)
  const [vehicleId, setVehicleId] = useState(null)
  const [clientId, setClientId] = useState(null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (form.placa.length !== 7) { setFound(false); setVehicleId(null); setClientId(null); return }
    const timer = setTimeout(() => lookup(form.placa), 250)
    return () => clearTimeout(timer)
  }, [form.placa])

  function update(key, value) { setForm(f => ({ ...f, [key]: value })) }

  async function lookup(plate) {
    if (!isValidPlate(plate)) return
    setChecking(true); setMessage('')
    const { data, error } = await supabase.from('veiculos').select('id,veiculo,cliente_id,clientes(id,nome,telefone)').eq('placa', normalizePlate(plate)).maybeSingle()
    setChecking(false)
    if (error) { setMessage('Erro ao consultar a placa.'); return }
    if (data) {
      setVehicleId(data.id); setClientId(data.cliente_id); setFound(true)
      setForm(f => ({ ...f, veiculo: data.veiculo, nome: data.clientes?.nome || '', telefone: digitsOnly(data.clientes?.telefone || '') }))
    } else {
      setFound(false); setVehicleId(null); setClientId(null)
      setForm(f => ({ ...f, veiculo: '', nome: '', telefone: '' }))
    }
  }

  async function submit(e) {
    e.preventDefault(); setMessage('')
    if (!isValidPlate(form.placa)) { setMessage('Informe uma placa válida. Ex.: ABC-1234 ou ABC-1D23.'); return }
    if (form.descricao_servico.trim().length < 2) { setMessage('Descreva o serviço realizado no veículo.'); return }
    const value = parseMoneyInput(form.valor)
    if (!value || value <= 0) { setMessage('Informe um valor maior que zero.'); return }
    setSaving(true)

    let currentClientId = clientId
    let currentVehicleId = vehicleId

    if (!found) {
      const { data: client, error: clientError } = await supabase.from('clientes').insert({ nome: form.nome.trim(), telefone: digitsOnly(form.telefone) }).select('id').single()
      if (clientError) { setSaving(false); setMessage('Não foi possível cadastrar o cliente.'); return }
      currentClientId = client.id

      const { data: vehicle, error: vehicleError } = await supabase.from('veiculos').insert({ placa: normalizePlate(form.placa), veiculo: form.veiculo.trim(), cliente_id: currentClientId }).select('id').single()
      if (vehicleError) { await supabase.from('clientes').delete().eq('id', currentClientId); setSaving(false); setMessage(vehicleError.code === '23505' ? 'Esta placa já está cadastrada.' : 'Não foi possível cadastrar o veículo.'); return }
      currentVehicleId = vehicle.id
    } else {
      const { error: updateError } = await supabase.from('clientes').update({ nome: form.nome.trim(), telefone: digitsOnly(form.telefone) }).eq('id', currentClientId)
      if (updateError) { setSaving(false); setMessage('Não foi possível atualizar o cliente.'); return }
      const { error: vehicleUpdateError } = await supabase.from('veiculos').update({ veiculo: form.veiculo.trim() }).eq('id', currentVehicleId)
      if (vehicleUpdateError) { setSaving(false); setMessage('Não foi possível atualizar o veículo.'); return }
    }

    const { error } = await supabase.from('atendimentos').insert({
      veiculo_id: currentVehicleId,
      descricao_servico: form.descricao_servico.trim(),
      valor: value,
      forma_pagamento: form.forma_pagamento.toLowerCase(),
      status_pagamento: form.status_pagamento,
    })

    setSaving(false)
    if (error) { setMessage('Não foi possível salvar o atendimento.'); return }
    setForm(empty); setFound(false); setVehicleId(null); setClientId(null)
    navigate('dashboard')
  }

  const numericValue = parseMoneyInput(form.valor)

  return <form onSubmit={submit} className="space-y-4">
    <div className="card">
      <label className="label">Placa do veículo</label>
      <input
        className="input text-center text-xl font-black uppercase tracking-[.16em]"
        value={formatPlate(form.placa)}
        onChange={e => update('placa', normalizePlate(e.target.value))}
        placeholder="ABC-1234"
        maxLength={8}
        autoCapitalize="characters"
        autoCorrect="off"
        required
      />
      <div className="mt-2 min-h-5 text-xs font-semibold">{checking ? <span className="text-slate-500">Consultando placa...</span> : found ? <span className="text-emerald-700">✓ Veículo encontrado. Dados preenchidos.</span> : form.placa.length === 7 ? <span className="text-blue-700">Nova placa. Preencha o cadastro.</span> : null}</div>
    </div>

    <div className="card space-y-4">
      <Field label="Veículo" value={form.veiculo} onChange={v => update('veiculo', v)} placeholder="Ex.: Onix branco" />
      <Field label="Nome do Cliente" value={form.nome} onChange={v => update('nome', v)} placeholder="Nome completo" />
      <Field
        label="Telefone"
        value={form.telefone}
        onChange={v => update('telefone', digitsOnly(v))}
        placeholder="11999999999"
        inputMode="numeric"
        pattern="[0-9]*"
      />
      <div>
        <label className="label">Descrição do Serviço</label>
        <textarea
          className="input min-h-24 resize-y"
          value={form.descricao_servico}
          onChange={e => update('descricao_servico', e.target.value)}
          placeholder="Ex.: Lavagem completa + remoção de ralado na porta"
          maxLength={500}
          required
        />
        <p className="mt-1 text-xs text-slate-500">Descreva o que foi realizado no veículo.</p>
      </div>
      <div>
        <label className="label">Valor</label>
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
      <div><label className="label">Forma de Pagamento</label><select className="input" value={form.forma_pagamento} onChange={e => update('forma_pagamento', e.target.value)}><option>PIX</option><option>Dinheiro</option><option>Cartão</option></select></div>
      <div><label className="label">Status de Pagamento</label><div className="grid grid-cols-2 gap-2"><Choice active={form.status_pagamento === 'pago'} onClick={() => update('status_pagamento', 'pago')} label="Pago" /><Choice active={form.status_pagamento === 'pendente'} onClick={() => update('status_pagamento', 'pendente')} label="Pendente" /></div></div>
    </div>

    {message && <div className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{message}</div>}
    <button className="btn-primary" disabled={saving || checking}>{saving ? 'Salvando...' : 'Salvar atendimento'}</button>
  </form>
}

function Field({ label, value, onChange, placeholder, inputMode, pattern }) { return <div><label className="label">{label}</label><input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} pattern={pattern} required /></div> }
function Choice({ active, onClick, label }) { return <button type="button" onClick={onClick} className={`min-h-12 rounded-2xl border px-4 font-bold ${active ? 'border-blue-900 bg-blue-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{label}</button> }
