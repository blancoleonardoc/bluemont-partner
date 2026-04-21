-- ================================================================
-- bluemont partner — Supabase schema
-- rodar no SQL Editor do Supabase (uma vez, ou idempotente via IF NOT EXISTS)
-- ================================================================

-- 1) access_logs: auditoria de login (sucesso + negado)
create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  name text,
  allowed boolean not null,
  event text not null,
  ip text,
  user_agent text
);
create index if not exists access_logs_email_idx on public.access_logs(email);
create index if not exists access_logs_created_idx on public.access_logs(created_at desc);

alter table public.access_logs enable row level security;

drop policy if exists "deny_anon_select" on public.access_logs;
drop policy if exists "deny_anon_insert" on public.access_logs;
create policy "deny_anon_select" on public.access_logs for select to anon using (false);
create policy "deny_anon_insert" on public.access_logs for insert to anon with check (false);

-- 2) assessor_settings: perfil e preferências do assessor
create table if not exists public.assessor_settings (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  last_name text,
  pix_key text,
  pix_key_type text,
  notifications_enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists assessor_settings_email_idx on public.assessor_settings(email);

alter table public.assessor_settings enable row level security;

-- leitura/escrita somente via service_role (route handlers).
-- anon fica bloqueado — RLS nega por default quando não há policy permissiva.
drop policy if exists "deny_anon_all" on public.assessor_settings;
create policy "deny_anon_all" on public.assessor_settings for all to anon using (false) with check (false);

-- ================================================================
-- pronto. service_role bypassa RLS automaticamente.
-- ================================================================
