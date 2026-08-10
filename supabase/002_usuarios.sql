-- Atualização 02 - Perfis, login por usuário e autorização
-- Execute no SQL Editor do Supabase APÓS o 001_schema.sql.
-- Segurança: este script espera que exista exatamente 1 usuário no Auth neste momento.
-- Esse usuário será cadastrado como administrador com login "eric".

create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) >= 2),
  login varchar(30) not null unique,
  perfil text not null default 'usuario' check (perfil in ('admin', 'usuario')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint perfis_login_formato check (login ~ '^[a-z0-9._-]{3,30}$')
);

create or replace function public.normalizar_perfil()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.nome := trim(new.nome);
  new.login := lower(trim(new.login));
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists trg_normalizar_perfil on public.perfis;
create trigger trg_normalizar_perfil
before insert or update on public.perfis
for each row execute function public.normalizar_perfil();

-- Inicializa o único usuário existente como administrador.
-- Se houver mais de um usuário no Auth, o script para sem escolher por conta própria.
do $$
declare
  v_count integer;
  v_admin_id uuid;
begin
  select count(*) into v_count from auth.users;

  if v_count <> 1 then
    raise exception 'Esperado exatamente 1 usuario no Authentication para criar o administrador, mas foram encontrados %.', v_count;
  end if;

  select id into v_admin_id from auth.users limit 1;

  insert into public.perfis (id, nome, login, perfil, ativo)
  values (v_admin_id, 'Eric Polari', 'eric', 'admin', true)
  on conflict (id) do update
    set nome = excluded.nome,
        login = excluded.login,
        perfil = 'admin',
        ativo = true,
        atualizado_em = now();
end;
$$;

alter table public.perfis enable row level security;

grant select on public.perfis to authenticated;
revoke insert, update, delete on public.perfis from authenticated;

-- Funções usadas pelas políticas. SECURITY DEFINER evita recursão da própria RLS de perfis.
create or replace function public.usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and ativo = true
  );
$$;

create or replace function public.usuario_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.perfis
    where id = auth.uid()
      and ativo = true
      and perfil = 'admin'
  );
$$;

revoke all on function public.usuario_ativo() from public;
revoke all on function public.usuario_admin() from public;
grant execute on function public.usuario_ativo() to authenticated;
grant execute on function public.usuario_admin() to authenticated;

-- Cada usuário vê seu próprio perfil. O administrador vê todos.
drop policy if exists "perfis_select_self_or_admin" on public.perfis;
create policy "perfis_select_self_or_admin"
on public.perfis
for select
to authenticated
using (id = auth.uid() or public.usuario_admin());

-- Substitui a regra antiga "qualquer autenticado" por "usuário ativo".
drop policy if exists "clientes_authenticated_all" on public.clientes;
drop policy if exists "veiculos_authenticated_all" on public.veiculos;
drop policy if exists "atendimentos_authenticated_all" on public.atendimentos;

drop policy if exists "clientes_active_all" on public.clientes;
drop policy if exists "veiculos_active_all" on public.veiculos;
drop policy if exists "atendimentos_active_all" on public.atendimentos;

create policy "clientes_active_all"
on public.clientes for all to authenticated
using (public.usuario_ativo())
with check (public.usuario_ativo());

create policy "veiculos_active_all"
on public.veiculos for all to authenticated
using (public.usuario_ativo())
with check (public.usuario_ativo());

create policy "atendimentos_active_all"
on public.atendimentos for all to authenticated
using (public.usuario_ativo())
with check (public.usuario_ativo());
