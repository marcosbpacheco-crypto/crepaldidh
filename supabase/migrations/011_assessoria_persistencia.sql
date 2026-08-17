-- =============================================
-- Migration 011: Assessoria - persistência completa
--
-- Objetivo: corrigir perda de dados no módulo Assessoria.
-- As operações CRUD do frontend usavam um modelo de dados
-- rico (titulo, areasAvaliadas, pontuacaoGeral, keyResults,
-- itens, etc.) que não possui colunas correspondentes no
-- banco. A coluna `dados` (JSONB) armazena o objeto completo
-- do frontend, garantindo round-trip sem perda de campos.
-- =============================================

ALTER TABLE public.assessoria_diagnostics ADD COLUMN IF NOT EXISTS dados JSONB NULL;
ALTER TABLE public.assessoria_okrs       ADD COLUMN IF NOT EXISTS dados JSONB NULL;
ALTER TABLE public.assessoria_swots       ADD COLUMN IF NOT EXISTS dados JSONB NULL;
ALTER TABLE public.assessoria_action_plans ADD COLUMN IF NOT EXISTS dados JSONB NULL;
ALTER TABLE public.assessoria_kpis        ADD COLUMN IF NOT EXISTS dados JSONB NULL;