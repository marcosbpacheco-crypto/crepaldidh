-- =============================================
-- Migration 010: Serviços
--
-- Objetivo: catálogo de serviços prestados pela
-- CrepaldiDH, com opção de cadastrar novos serviços.
-- =============================================

CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category VARCHAR(100) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ(6) NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ(6) NULL
);

CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON public.services (deleted_at);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services (status);
CREATE INDEX IF NOT EXISTS idx_services_name ON public.services (name);

-- Seed: serviços praticados pela CrepaldiDH
INSERT INTO public.services (name, category, status) VALUES
  ('Assessoria de Performance Organizacional', 'Assessoria', 'ativo'),
  ('Mentorias', 'Mentoria', 'ativo'),
  ('Treinamentos', 'Treinamento', 'ativo'),
  ('Palestras', 'Treinamento', 'ativo'),
  ('Workshops', 'Treinamento', 'ativo'),
  ('Consultorias', 'Consultoria', 'ativo'),
  ('Recrutamento e Seleção', 'DHO', 'ativo'),
  ('Avaliação Psicológica', 'DHO', 'ativo'),
  ('Avaliação Comportamental', 'DHO', 'ativo'),
  ('Pesquisa de Clima', 'DHO', 'ativo'),
  ('Desenvolvimento de Lideranças', 'DHO', 'ativo'),
  ('PCCS', 'DHO', 'ativo'),
  ('Onboarding', 'DHO', 'ativo'),
  ('Diagnóstico Organizacional', 'Assessoria', 'ativo'),
  ('NR-1', 'Consultoria', 'ativo')
ON CONFLICT DO NOTHING;
