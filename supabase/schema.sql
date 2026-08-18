-- =====================================================================
-- Projetinho de Benjamin pra Isabela 💗 — esquema completo do Supabase
-- Rode este arquivo inteiro no SQL Editor do projeto (uma vez só).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------

create table if not exists public.perfis (
  id uuid primary key references auth.users on delete cascade,
  nome text not null,
  papel text not null check (papel in ('isabela','benjamin')),
  data_nascimento date,
  altura_cm numeric,
  peso_inicial_kg numeric,
  criado_em timestamptz default now()
);

create table if not exists public.pesos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfis(id) on delete cascade,
  data date not null,
  peso_kg numeric not null,
  unique (user_id, data)
);

create table if not exists public.dias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfis(id) on delete cascade,
  data date not null,
  corrida_ok boolean default false,
  natacao_ok boolean default false,
  bonus_sexta_ok boolean default false,
  agua_ml integer default 0,
  agua_meta_ml integer not null,
  humor smallint check (humor between 1 and 5),
  calorias integer,
  fc_media integer,
  nota text,
  unique (user_id, data)
);

create table if not exists public.fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.perfis(id) on delete cascade,
  data date not null,
  tipo text not null check (tipo in ('evolucao','relogio')),
  storage_path text not null,
  criado_em timestamptz default now(),
  unique (user_id, data, tipo)
);

create table if not exists public.recados (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.perfis(id) on delete cascade,
  data date not null,
  texto text not null,
  lido boolean default false,
  criado_em timestamptz default now()
);

-- o botão "mandar beijinho 😘"
create table if not exists public.beijinhos (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references public.perfis(id) on delete cascade,
  visto boolean default false,
  criado_em timestamptz default now()
);

create index if not exists idx_pesos_user_data on public.pesos (user_id, data);
create index if not exists idx_dias_user_data on public.dias (user_id, data);
create index if not exists idx_fotos_user_data on public.fotos (user_id, data);
create index if not exists idx_recados_data on public.recados (data);
create index if not exists idx_beijinhos_criado on public.beijinhos (criado_em desc);

-- ---------------------------------------------------------------------
-- 2. Perfil criado sozinho no cadastro
-- ---------------------------------------------------------------------

create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', 'Você'),
    coalesce(new.raw_user_meta_data ->> 'papel', 'isabela')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------------------------------------------------------------------
-- 3. Papel de quem está logado
--    SECURITY DEFINER pra não cair em recursão de RLS na tabela perfis.
-- ---------------------------------------------------------------------

create or replace function public.meu_papel()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select papel from public.perfis where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- 4. RLS ligado em tudo
-- ---------------------------------------------------------------------

alter table public.perfis    enable row level security;
alter table public.pesos     enable row level security;
alter table public.dias      enable row level security;
alter table public.fotos     enable row level security;
alter table public.recados   enable row level security;
alter table public.beijinhos enable row level security;

-- perfis -------------------------------------------------------------
drop policy if exists "perfis_select" on public.perfis;
create policy "perfis_select" on public.perfis
  for select to authenticated
  using (
    id = auth.uid()
    or papel = 'isabela'
    or (papel = 'benjamin' and public.meu_papel() = 'isabela')
  );

drop policy if exists "perfis_insert" on public.perfis;
create policy "perfis_insert" on public.perfis
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "perfis_update" on public.perfis;
create policy "perfis_update" on public.perfis
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- pesos / dias / fotos: a Isabela escreve, o Benjamin só lê -----------
do $$
declare t text;
begin
  foreach t in array array['pesos','dias','fotos'] loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format($f$
      create policy "%1$s_select" on public.%1$s
        for select to authenticated
        using (user_id = auth.uid() or public.meu_papel() = 'benjamin')
    $f$, t);

    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format($f$
      create policy "%1$s_insert" on public.%1$s
        for insert to authenticated
        with check (user_id = auth.uid() and public.meu_papel() = 'isabela')
    $f$, t);

    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format($f$
      create policy "%1$s_update" on public.%1$s
        for update to authenticated
        using (user_id = auth.uid() and public.meu_papel() = 'isabela')
        with check (user_id = auth.uid())
    $f$, t);

    execute format('drop policy if exists "%1$s_delete" on public.%1$s', t);
    execute format($f$
      create policy "%1$s_delete" on public.%1$s
        for delete to authenticated
        using (user_id = auth.uid() and public.meu_papel() = 'isabela')
    $f$, t);
  end loop;
end $$;

-- recados: os dois leem, cada um assina o próprio --------------------
drop policy if exists "recados_select" on public.recados;
create policy "recados_select" on public.recados
  for select to authenticated using (true);

drop policy if exists "recados_insert" on public.recados;
create policy "recados_insert" on public.recados
  for insert to authenticated with check (autor_id = auth.uid());

-- quem recebe é quem marca como lido
drop policy if exists "recados_update" on public.recados;
create policy "recados_update" on public.recados
  for update to authenticated
  using (autor_id <> auth.uid())
  with check (autor_id <> auth.uid());

drop policy if exists "recados_delete" on public.recados;
create policy "recados_delete" on public.recados
  for delete to authenticated using (autor_id = auth.uid());

-- beijinhos: os dois mandam e os dois veem ---------------------------
drop policy if exists "beijinhos_select" on public.beijinhos;
create policy "beijinhos_select" on public.beijinhos
  for select to authenticated using (true);

drop policy if exists "beijinhos_insert" on public.beijinhos;
create policy "beijinhos_insert" on public.beijinhos
  for insert to authenticated with check (autor_id = auth.uid());

-- só quem recebeu marca como visto
drop policy if exists "beijinhos_update" on public.beijinhos;
create policy "beijinhos_update" on public.beijinhos
  for update to authenticated
  using (autor_id <> auth.uid())
  with check (autor_id <> auth.uid());

-- ---------------------------------------------------------------------
-- 5. Storage — bucket PRIVADO das fotinhas
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos_leitura" on storage.objects;
create policy "fotos_leitura" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fotos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.meu_papel() = 'benjamin'
    )
  );

drop policy if exists "fotos_envio" on storage.objects;
create policy "fotos_envio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.meu_papel() = 'isabela'
  );

drop policy if exists "fotos_troca" on storage.objects;
create policy "fotos_troca" on storage.objects
  for update to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "fotos_remocao" on storage.objects;
create policy "fotos_remocao" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------
-- 6. Tempo real — o celular do outro atualiza sozinho
-- ---------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['dias','pesos','fotos','recados','perfis','beijinhos'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. Permissões da Data API
--    Necessário quando "Automatically expose new tables" está DESLIGADO
--    no projeto. Só o papel `authenticated` entra — quem não fez login não
--    enxerga nada. As políticas de RLS acima continuam mandando nas linhas.
-- ---------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.perfis, public.pesos, public.dias,
  public.fotos, public.recados, public.beijinhos
  to authenticated;
