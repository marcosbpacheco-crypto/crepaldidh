-- 013_company_services.sql
-- Adiciona coluna `services` (JSON) em crm_companies para armazenar
-- os serviços selecionados ao criar/editar um cadastro de empresa (CRM).

alter table public.crm_companies
  add column if not exists services jsonb default '[]'::jsonb;
