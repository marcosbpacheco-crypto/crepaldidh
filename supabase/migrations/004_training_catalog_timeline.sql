-- =============================================
-- Migration 004: Catálogo de tipos de treinamento + linha do tempo
--
-- Objetivo:
--   1. Permitir treinamentos voltados a PESSOAS (sem empresa obrigatória)
--      e registrar o tipo de público-alvo (empresa | pessoa | ambos).
--   2. Criar tabela de TIPOS DE TREINAMENTO cadastráveis (catálogo),
--      vinculável a empresas ou pessoas.
--   3. Cada tipo cadastrado possui lista própria de MATERIAIS.
--   4. Cada evento (treinamento/palestra/workshop) ganha LINHA DO TEMPO
--      com etapas fixas para controle de progresso.
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. training_events: company_id opcional + target_type + vínculo ao catálogo
ALTER TABLE public.training_events
  ALTER COLUMN company_id DROP NOT NULL;

ALTER TABLE public.training_events
  ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) NULL DEFAULT 'empresa';

ALTER TABLE public.training_events
  ADD COLUMN IF NOT EXISTS training_type_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_training_events_target_type ON public.training_events (target_type);
CREATE INDEX IF NOT EXISTS idx_training_events_training_type ON public.training_events (training_type_id);

-- 2. Catálogo de tipos de treinamento
CREATE TABLE IF NOT EXISTS public.training_types (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  description   TEXT NULL,
  category      VARCHAR(50)  NOT NULL DEFAULT 'Treinamento', -- tab: Treinamento | Palestra | Workshop
  target_type   VARCHAR(20)  NOT NULL DEFAULT 'empresa',      -- empresa | pessoa | ambos
  hours_duration NUMERIC(5,2) NULL DEFAULT 0,
  active        BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NULL DEFAULT now()
);

-- 3. Materiais do catálogo (por tipo cadastrado)
CREATE TABLE IF NOT EXISTS public.training_type_materials (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_type_id UUID NOT NULL REFERENCES public.training_types(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  type             VARCHAR(50)  NOT NULL,
  file_url         VARCHAR(255) NULL,
  created_at       TIMESTAMPTZ  NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_type_materials_typeid ON public.training_type_materials (training_type_id);

-- 4. Linha do tempo do evento (etapas fixas)
CREATE TABLE IF NOT EXISTS public.training_timeline_steps (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id       UUID NOT NULL REFERENCES public.training_events(id) ON DELETE CASCADE,
  stage          VARCHAR(50)  NOT NULL, -- planejamento | materiais | divulgacao | execucao | avaliacao | certificados
  title          VARCHAR(255) NOT NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'pendente', -- pendente | em_andamento | concluido | bloqueado
  planned_date   DATE NULL,
  completed_date DATE NULL,
  notes          TEXT NULL,
  sort_order     INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ  NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_timeline_event ON public.training_timeline_steps (event_id);