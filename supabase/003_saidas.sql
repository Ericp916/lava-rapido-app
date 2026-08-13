-- Atualização 03 - Saídas / Gastos do caixa geral
-- Execute no SQL Editor do Supabase APÓS o 002_usuarios.sql.
-- Regra financeira: saldo do caixa = total recebido - total de saídas.
-- As saídas não reduzem faturamento nem alteram atendimentos.

create table if not exists public.saidas (
  id uuid primary key default gen_random_uuid(),
  justificativa varchar(120) not null check (char_length(trim(justificativa)) >= 3),
  valor numeric(10,2) not null check (valor > 0),
  data_saida date not null,
  usuario_id uuid not null references public.perfis(id) on delete restrict,
  usuario_nome text not null,
  usuario_login varchar(30) not null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_saidas_data_saida on public.saidas(data_saida desc);
create index if not exists idx_saidas_usuario_id on public.saidas(usuario_id);
create index if not exists idx_saidas_criado_em on public.saidas(criado_em desc);

-- O responsável é sempre definido pelo usuário autenticado.
-- O navegador não decide quem fez o lançamento.
create or replace function public.definir_autor_saida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text;
  v_login varchar(30);
  v_ativo boolean;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select nome, login, ativo
    into v_nome, v_login, v_ativo
  from public.perfis
  where id = auth.uid();

  if v_nome is null or v_ativo is distinct from true then
    raise exception 'Usuario sem acesso ativo.';
  end if;

  new.justificativa := trim(new.justificativa);
  new.usuario_id := auth.uid();
  new.usuario_nome := v_nome;
  new.usuario_login := v_login;
  return new;
end;
$$;

revoke all on function public.definir_autor_saida() from public;

drop trigger if exists trg_definir_autor_saida on public.saidas;
create trigger trg_definir_autor_saida
before insert on public.saidas
for each row execute function public.definir_autor_saida();

alter table public.saidas enable row level security;

grant select, insert on public.saidas to authenticated;
revoke update, delete on public.saidas from authenticated;

drop policy if exists "saidas_active_select" on public.saidas;
drop policy if exists "saidas_active_insert" on public.saidas;

create policy "saidas_active_select"
on public.saidas
for select
to authenticated
using (public.usuario_ativo());

create policy "saidas_active_insert"
on public.saidas
for insert
to authenticated
with check (public.usuario_ativo() and usuario_id = auth.uid());

-- Resumo financeiro usado na tela de Saídas.
-- Datas nulas retornam o caixa geral acumulado.
create or replace function public.resumo_caixa(
  p_data_inicio date,
  p_data_fim date
)
returns table (
  recebido numeric,
  saidas numeric,
  saldo numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with r as (
    select coalesce(sum(a.valor), 0)::numeric as total
    from public.atendimentos a
    where a.status_pagamento = 'pago'
      and a.data_pagamento is not null
      and (p_data_inicio is null or (a.data_pagamento at time zone 'America/Sao_Paulo')::date >= p_data_inicio)
      and (p_data_fim is null or (a.data_pagamento at time zone 'America/Sao_Paulo')::date <= p_data_fim)
  ),
  s as (
    select coalesce(sum(x.valor), 0)::numeric as total
    from public.saidas x
    where (p_data_inicio is null or x.data_saida >= p_data_inicio)
      and (p_data_fim is null or x.data_saida <= p_data_fim)
  )
  select r.total as recebido,
         s.total as saidas,
         (r.total - s.total)::numeric as saldo
  from r cross join s;
$$;

grant execute on function public.resumo_caixa(date, date) to authenticated;
