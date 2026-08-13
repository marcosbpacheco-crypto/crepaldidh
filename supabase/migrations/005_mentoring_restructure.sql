-- ============================================================
-- 005_mentoring_restructure.sql
-- Reestruturação do módulo Mentorias:
--  - Mentoria Individual (programa com mentorado)
--  - Mentoria para RH (programa organizacional)
-- SEM PDI: Objetivos + Ações substituem o conceito de PDI.
-- Tabelas PDI existentes (pdi_plans/pdi_goals) NÃO são alteradas.
-- ============================================================

-- ------------------------------------------------------------
-- mentoring_programs — um registro por mentoria
--   modality = 'individual' | 'rh'
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentoring_programs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modality        varchar(20)  NOT NULL DEFAULT 'individual',
  name            varchar(255) NOT NULL,
  company_id      uuid,
  company_name    varchar(255),
  mentor          varchar(255),
  rh_responsible  varchar(255),
  status          varchar(50)  NOT NULL DEFAULT 'planejada',
  start_date      date,
  end_date        date,
  main_objective  text,
  progress        int          NOT NULL DEFAULT 0,
  notes           text,
  -- mentorado (mentoria individual)
  mentee_name     varchar(255),
  mentee_role     varchar(255),
  mentee_department varchar(255),
  mentee_contact  varchar(255),
  mentee_gestor   varchar(255),
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentoring_programs_company ON public.mentoring_programs (company_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_programs_modality ON public.mentoring_programs (modality);
CREATE INDEX IF NOT EXISTS idx_mentoring_programs_status ON public.mentoring_programs (status);

-- ------------------------------------------------------------
-- mentoring_objectives — objetivos de mentoria (individuais e RH)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentoring_objectives (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid NOT NULL REFERENCES public.mentoring_programs(id) ON DELETE CASCADE,
  title       varchar(255) NOT NULL,
  description text,
  category    varchar(100),
  priority    varchar(20),
  indicator   varchar(255),
  goal        varchar(255),
  deadline    date,
  progress    int          NOT NULL DEFAULT 0,
  status      varchar(50)  NOT NULL DEFAULT 'nao_iniciado',
  observations text,
  responsible varchar(255),
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentoring_objectives_program ON public.mentoring_objectives (program_id);

-- ------------------------------------------------------------
-- mentoring_actions — ações vinculadas aos objetivos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentoring_actions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id     uuid NOT NULL REFERENCES public.mentoring_programs(id) ON DELETE CASCADE,
  objective_id   uuid REFERENCES public.mentoring_objectives(id) ON DELETE SET NULL,
  description    varchar(255) NOT NULL,
  responsible    varchar(255),
  deadline       date,
  priority       varchar(20),
  status         varchar(50)  NOT NULL DEFAULT 'pendente',
  evidence       text,
  comment        text,
  completed_date date,
  created_at     timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentoring_actions_program ON public.mentoring_actions (program_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_actions_objective ON public.mentoring_actions (objective_id);

-- ------------------------------------------------------------
-- mentoring_feedbacks — avaliação de sessão (satisfação, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentoring_feedbacks (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id         uuid NOT NULL REFERENCES public.mentoring_programs(id) ON DELETE CASCADE,
  session_id         uuid REFERENCES public.mentoring_sessions(id) ON DELETE CASCADE,
  author_type        varchar(20) NOT NULL DEFAULT 'mentor',
  satisfaction       int,
  relevance          int,
  applicability      int,
  evolution_perceived int,
  comments           text,
  created_at         timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentoring_feedbacks_program ON public.mentoring_feedbacks (program_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_feedbacks_session ON public.mentoring_feedbacks (session_id);

-- ------------------------------------------------------------
-- mentoring_diagnostics — diagnóstico RH (áreas com nota/maturidade)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentoring_diagnostics (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id   uuid NOT NULL REFERENCES public.mentoring_programs(id) ON DELETE CASCADE,
  period       varchar(100),
  status       varchar(50) NOT NULL DEFAULT 'rascunho',
  areas        jsonb,
  observations text,
  created_at   timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentoring_diagnostics_program ON public.mentoring_diagnostics (program_id);

-- ------------------------------------------------------------
-- mentoring_indicators — indicadores do programa RH
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentoring_indicators (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id    uuid NOT NULL REFERENCES public.mentoring_programs(id) ON DELETE CASCADE,
  name          varchar(255) NOT NULL,
  description   text,
  unit          varchar(50),
  initial_value varchar(100),
  current_value varchar(100),
  target_value  varchar(100),
  trend         varchar(50),
  period        varchar(100),
  source        varchar(255),
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentoring_indicators_program ON public.mentoring_indicators (program_id);

-- ------------------------------------------------------------
-- mentoring_documents — documentos relacionados à mentoria
--   respeita o módulo Documentos (document_id opcional)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentoring_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid NOT NULL REFERENCES public.mentoring_programs(id) ON DELETE CASCADE,
  session_id  uuid REFERENCES public.mentoring_sessions(id) ON DELETE CASCADE,
  document_id uuid,
  name        varchar(255) NOT NULL,
  type        varchar(100),
  file_url    varchar(1024),
  description text,
  created_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentoring_documents_program ON public.mentoring_documents (program_id);

-- ------------------------------------------------------------
-- mentoring_history — histórico/auditoria do programa
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mentoring_history (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  uuid NOT NULL REFERENCES public.mentoring_programs(id) ON DELETE CASCADE,
  entity_type varchar(50),
  entity_id   varchar(100),
  action      varchar(255),
  description text,
  created_by  varchar(255),
  created_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentoring_history_program ON public.mentoring_history (program_id);

-- ------------------------------------------------------------
-- mentoring_sessions — estender tabela existente
-- ------------------------------------------------------------
ALTER TABLE public.mentoring_sessions
  ADD COLUMN IF NOT EXISTS program_id uuid,
  ADD COLUMN IF NOT EXISTS session_number int,
  ADD COLUMN IF NOT EXISTS start_time time,
  ADD COLUMN IF NOT EXISTS modality varchar(50),
  ADD COLUMN IF NOT EXISTS theme varchar(255),
  ADD COLUMN IF NOT EXISTS session_objective text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS key_points text,
  ADD COLUMN IF NOT EXISTS decisions text,
  ADD COLUMN IF NOT EXISTS defined_actions text,
  ADD COLUMN IF NOT EXISTS private_observations text,
  ADD COLUMN IF NOT EXISTS session_feedback text,
  ADD COLUMN IF NOT EXISTS next_session date,
  ADD COLUMN IF NOT EXISTS mentor varchar(255),
  ADD COLUMN IF NOT EXISTS mentee varchar(255);

CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_program ON public.mentoring_sessions (program_id);

-- ------------------------------------------------------------
-- mentoring_participants — estender tabela existente
--   program_id: vínculo ao programa RH
--   participant_type: rh | lideranca | gestor | colaborador | direcao | outro
-- ------------------------------------------------------------
ALTER TABLE public.mentoring_participants
  ADD COLUMN IF NOT EXISTS program_id uuid,
  ADD COLUMN IF NOT EXISTS participant_type varchar(50);

CREATE INDEX IF NOT EXISTS idx_mentoring_participants_program ON public.mentoring_participants (program_id);
