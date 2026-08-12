-- =============================================
-- Migration 003: Tarefas - criador e destinatário
--
-- Objetivo: registrar quem criou a tarefa e a quem
-- a tarefa foi atribuída, para exibição no card e
-- geração de alerta na central de alertas.
-- =============================================

ALTER TABLE public.crm_tasks
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) NULL;

ALTER TABLE public.crm_tasks
  ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_crm_tasks_created_by ON public.crm_tasks (created_by);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON public.crm_tasks (assigned_to);