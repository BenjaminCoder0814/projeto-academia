-- =====================================================================
-- Migração: a galeria do dia 📸
--
-- Rode isto UMA VEZ no SQL Editor do Supabase (projeto academia-amor).
-- Sem isso, a Isabela só consegue mandar uma fotinha por dia.
--
-- O que muda: a foto do dia ('evolucao') e a do relógio ('relogio')
-- continuam sendo uma por dia. A 'galeria' aceita quantas ela quiser.
-- =====================================================================

-- 1. o tipo 'galeria' passa a existir
alter table public.fotos drop constraint if exists fotos_tipo_check;
alter table public.fotos
  add constraint fotos_tipo_check
  check (tipo in ('evolucao', 'relogio', 'galeria'));

-- 2. sai a regra de "uma por dia e tipo" que valia pra tudo...
alter table public.fotos drop constraint if exists fotos_user_id_data_tipo_key;

-- 3. ...e entra a mesma regra, mas só pras duas fotos oficiais
create unique index if not exists fotos_uma_por_tipo
  on public.fotos (user_id, data, tipo)
  where tipo in ('evolucao', 'relogio');

-- 4. confere: deve listar fotos_uma_por_tipo
select indexname from pg_indexes where tablename = 'fotos';
