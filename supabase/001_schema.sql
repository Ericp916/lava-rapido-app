-- Lava Rápido - esquema inicial
-- Execute no SQL Editor do Supabase em um projeto novo.

create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) >= 2),
  telefone text not null,
  criado_em timestamptz not null default now()
);

create table if not exists public.veiculos (
  id uuid primary key default gen_random_uuid(),
  placa varchar(7) not null unique,
  veiculo text not null check (char_length(trim(veiculo)) >= 2),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  criado_em timestamptz not null default now(),
  constraint placa_formato check (placa ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$')
);

create table if not exists public.atendimentos (
  id uuid primary key default gen_random_uuid(),
  veiculo_id uuid not null references public.veiculos(id) on delete restrict,
  valor numeric(10,2) not null check (valor > 0),
  forma_pagamento text not null check (forma_pagamento in ('pix','dinheiro','cartão')),
  status_pagamento text not null check (status_pagamento in ('pago','pendente')),
  data_cadastro timestamptz not null default now(),
  data_pagamento timestamptz null
);

create index if not exists idx_veiculos_cliente_id on public.veiculos(cliente_id);
create index if not exists idx_atendimentos_veiculo_id on public.atendimentos(veiculo_id);
create index if not exists idx_atendimentos_data_cadastro on public.atendimentos(data_cadastro desc);
create index if not exists idx_atendimentos_status on public.atendimentos(status_pagamento);
create index if not exists idx_atendimentos_data_pagamento on public.atendimentos(data_pagamento desc);

create or replace function public.normalizar_placa()
returns trigger
language plpgsql
as $$
begin
  new.placa := upper(regexp_replace(new.placa, '[^A-Za-z0-9]', '', 'g'));
  return new;
end;
$$;

drop trigger if exists trg_normalizar_placa on public.veiculos;
create trigger trg_normalizar_placa before insert or update of placa on public.veiculos
for each row execute function public.normalizar_placa();

create or replace function public.definir_data_pagamento()
returns trigger
language plpgsql
as $$
begin
  if new.status_pagamento = 'pago' and (old.status_pagamento is distinct from 'pago' or new.data_pagamento is null) then
    new.data_pagamento := now();
  elsif new.status_pagamento = 'pendente' then
    new.data_pagamento := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_definir_data_pagamento on public.atendimentos;
create trigger trg_definir_data_pagamento before insert or update of status_pagamento on public.atendimentos
for each row execute function public.definir_data_pagamento();

alter table public.clientes enable row level security;
alter table public.veiculos enable row level security;
alter table public.atendimentos enable row level security;

grant select, insert, update, delete on public.clientes to authenticated;
grant select, insert, update, delete on public.veiculos to authenticated;
grant select, insert, update, delete on public.atendimentos to authenticated;

-- Primeira versão: qualquer usuário autenticado pode trabalhar com os dados.
drop policy if exists "clientes_authenticated_all" on public.clientes;
drop policy if exists "veiculos_authenticated_all" on public.veiculos;
drop policy if exists "atendimentos_authenticated_all" on public.atendimentos;
create policy "clientes_authenticated_all" on public.clientes for all to authenticated using (true) with check (true);
create policy "veiculos_authenticated_all" on public.veiculos for all to authenticated using (true) with check (true);
create policy "atendimentos_authenticated_all" on public.atendimentos for all to authenticated using (true) with check (true);

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
  c.telefone
from public.atendimentos a
join public.veiculos v on v.id = a.veiculo_id
join public.clientes c on c.id = v.cliente_id;

grant select on public.vw_atendimentos_detalhes to authenticated;
