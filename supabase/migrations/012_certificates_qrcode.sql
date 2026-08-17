-- =============================================
-- Migration 012: Certificados - persistência dos campos de exibição + NPS pendente
--
-- Objetivo:
-- 1. training_certificates: armazenar os campos exibidos no preview/tabela
--    (participant_name, event_name, client_name, hours, facilitator, event_date)
--    que antes ficavam apenas em cache e eram perdidos após refresh.
-- 2. training_feedbacks: coluna `status` ('pendente' | 'respondido') para
--    permitir criar avaliações NPS pendentes por participante ao confirmar
--    presença, e filtrar as pendentes dos cálculos de média/NPS.
-- =============================================

ALTER TABLE public.training_events ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) NULL;

ALTER TABLE public.training_certificates ADD COLUMN IF NOT EXISTS participant_name VARCHAR(255) NULL;
ALTER TABLE public.training_certificates ADD COLUMN IF NOT EXISTS event_name       VARCHAR(255) NULL;
ALTER TABLE public.training_certificates ADD COLUMN IF NOT EXISTS client_name      VARCHAR(255) NULL;
ALTER TABLE public.training_certificates ADD COLUMN IF NOT EXISTS hours            DECIMAL(5,2) NULL;
ALTER TABLE public.training_certificates ADD COLUMN IF NOT EXISTS facilitator      VARCHAR(255) NULL;
ALTER TABLE public.training_certificates ADD COLUMN IF NOT EXISTS event_date       DATE NULL;

ALTER TABLE public.training_feedbacks ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'respondido';