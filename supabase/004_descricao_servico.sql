-- Atualização 004 - Descrição do serviço realizado no atendimento

alter table public.atendimentos
  add column if not exists descricao_servico text not null default '';

comment on column public.atendimentos.descricao_servico is
  'Descrição livre do serviço realizado no veículo durante o atendimento.';

create or replace view public.vw_atendimentos_detalhes
with (security_invoker = true)
as
select
  a.id,
  a.veiculo_id,
  a.valor,
  a.forma_pagamento,
  a.status_pagamento,
  a.data_cadastro,
  a.data_pagamento,
  v.placa,
  v.veiculo,
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.telefone,
  a.descricao_servico
from public.atendimentos a
join public.veiculos v on v.id = a.veiculo_id
join public.clientes c on c.id = v.cliente_id;

grant select on public.vw_atendimentos_detalhes to authenticated;
