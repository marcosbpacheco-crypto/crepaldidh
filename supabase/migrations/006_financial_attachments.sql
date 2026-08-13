-- 006_financial_attachments.sql
-- Adds attachment support for accounts receivable and payable.

alter table public.financial_accounts_receivable add column if not exists attachment_url text;
alter table public.financial_accounts_payable add column if not exists attachment_url text;