-- Migration: 001_initial_schema_clean.sql
-- Descrição: Criação limpa das tabelas principais com tenant isolation,
-- soft delete, RLS, policies, triggers e índices.

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. FUNÇÃO TRIGGER updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. PROFILES (já existe — adicionar colunas faltantes)
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. COMPANIES (crm_companies — adicionar tenant_id, legal_name, created_by, updated_at, deleted_at)
-- ============================================================
ALTER TABLE public.crm_companies
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS trg_crm_companies_updated_at ON public.crm_companies;
CREATE TRIGGER trg_crm_companies_updated_at
  BEFORE UPDATE ON public.crm_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. CONTACTS (crm_contacts — adicionar tenant_id, updated_at, deleted_at)
-- ============================================================
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS trg_crm_contacts_updated_at ON public.crm_contacts;
CREATE TRIGGER trg_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. PROJECTS (NOVA)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.crm_companies(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. PROJECT_TASKS (NOVA)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_project_tasks_updated_at ON public.project_tasks;
CREATE TRIGGER trg_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. CALENDAR_EVENTS (adicionar tenant_id, project_id, responsible_user_id, updated_at, deleted_at)
-- ============================================================
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS responsible_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS trg_calendar_events_updated_at ON public.calendar_events;
CREATE TRIGGER trg_calendar_events_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. TRAINING_EVENTS (adicionar tenant_id, updated_at, deleted_at)
-- ============================================================
ALTER TABLE public.training_events
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS trg_training_events_updated_at ON public.training_events;
CREATE TRIGGER trg_training_events_updated_at
  BEFORE UPDATE ON public.training_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. DOCUMENTS (adicionar tenant_id, project_id, category, visibility, updated_at, deleted_at)
-- ============================================================
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. ÍNDICES
-- ============================================================
-- Companies
CREATE INDEX IF NOT EXISTS idx_crm_companies_tenant_id ON public.crm_companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_companies_status ON public.crm_companies(status);
CREATE INDEX IF NOT EXISTS idx_crm_companies_deleted_at ON public.crm_companies(deleted_at);
CREATE INDEX IF NOT EXISTS idx_crm_companies_tenant_status ON public.crm_companies(tenant_id, status) WHERE deleted_at IS NULL;

-- Contacts
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company_id ON public.crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tenant_id ON public.crm_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_deleted_at ON public.crm_contacts(deleted_at);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON public.projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_responsible ON public.projects(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_status ON public.projects(tenant_id, status) WHERE deleted_at IS NULL;

-- Project Tasks
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_tenant_id ON public.project_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_deleted_at ON public.project_tasks(deleted_at);

-- Calendar Events
CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant_id ON public.calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_company_id ON public.calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id ON public.calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_responsible ON public.calendar_events(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_deleted_at ON public.calendar_events(deleted_at);

-- Training Events
CREATE INDEX IF NOT EXISTS idx_training_events_tenant_id ON public.training_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_training_events_company_id ON public.training_events(company_id);
CREATE INDEX IF NOT EXISTS idx_training_events_project_id ON public.training_events(project_id);
CREATE INDEX IF NOT EXISTS idx_training_events_status ON public.training_events(status);
CREATE INDEX IF NOT EXISTS idx_training_events_date ON public.training_events(event_date);
CREATE INDEX IF NOT EXISTS idx_training_events_deleted_at ON public.training_events(deleted_at);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON public.documents(deleted_at);

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(active);
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);

-- ============================================================
-- 12. RLS — HABILITAR EM TODAS AS TABELAS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. POLICIES — POR TABELA
-- ============================================================

-- Função auxiliar: verifica se usuário é admin/diretor
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role_name IN ('Administrador', 'Diretor')
    FROM public.profiles
    WHERE id = auth.uid()
      AND active = true
      AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== PROFILES ==========
DROP POLICY IF EXISTS "users_select_own_or_staff" ON public.profiles;
CREATE POLICY "users_select_own_or_staff" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "users_update_own" ON public.profiles;
CREATE POLICY "users_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "staff_insert" ON public.profiles;
CREATE POLICY "staff_insert" ON public.profiles
  FOR INSERT WITH CHECK (public.is_staff());

-- ========== COMPANIES ==========
DROP POLICY IF EXISTS "tenant_select_companies" ON public.crm_companies;
CREATE POLICY "tenant_select_companies" ON public.crm_companies
  FOR SELECT USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_insert_companies" ON public.crm_companies;
CREATE POLICY "tenant_insert_companies" ON public.crm_companies
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_update_companies" ON public.crm_companies;
CREATE POLICY "tenant_update_companies" ON public.crm_companies
  FOR UPDATE USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_delete_companies" ON public.crm_companies;
CREATE POLICY "tenant_delete_companies" ON public.crm_companies
  FOR DELETE USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

-- ========== CONTACTS ==========
DROP POLICY IF EXISTS "tenant_select_contacts" ON public.crm_contacts;
CREATE POLICY "tenant_select_contacts" ON public.crm_contacts
  FOR SELECT USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_insert_contacts" ON public.crm_contacts;
CREATE POLICY "tenant_insert_contacts" ON public.crm_contacts
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_update_contacts" ON public.crm_contacts;
CREATE POLICY "tenant_update_contacts" ON public.crm_contacts
  FOR UPDATE USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

-- ========== PROJECTS ==========
DROP POLICY IF EXISTS "tenant_select_projects" ON public.projects;
CREATE POLICY "tenant_select_projects" ON public.projects
  FOR SELECT USING (
    tenant_id = auth.uid() OR responsible_user_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_insert_projects" ON public.projects;
CREATE POLICY "tenant_insert_projects" ON public.projects
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_update_projects" ON public.projects;
CREATE POLICY "tenant_update_projects" ON public.projects
  FOR UPDATE USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

-- ========== PROJECT TASKS ==========
DROP POLICY IF EXISTS "tenant_select_tasks" ON public.project_tasks;
CREATE POLICY "tenant_select_tasks" ON public.project_tasks
  FOR SELECT USING (
    tenant_id = auth.uid() OR assigned_to = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_insert_tasks" ON public.project_tasks;
CREATE POLICY "tenant_insert_tasks" ON public.project_tasks
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_update_tasks" ON public.project_tasks;
CREATE POLICY "tenant_update_tasks" ON public.project_tasks
  FOR UPDATE USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

-- ========== CALENDAR EVENTS ==========
DROP POLICY IF EXISTS "tenant_select_calendar" ON public.calendar_events;
CREATE POLICY "tenant_select_calendar" ON public.calendar_events
  FOR SELECT USING (
    tenant_id = auth.uid() OR responsible_user_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_insert_calendar" ON public.calendar_events;
CREATE POLICY "tenant_insert_calendar" ON public.calendar_events
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_update_calendar" ON public.calendar_events;
CREATE POLICY "tenant_update_calendar" ON public.calendar_events
  FOR UPDATE USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

-- ========== TRAINING EVENTS ==========
DROP POLICY IF EXISTS "tenant_select_trainings" ON public.training_events;
CREATE POLICY "tenant_select_trainings" ON public.training_events
  FOR SELECT USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_insert_trainings" ON public.training_events;
CREATE POLICY "tenant_insert_trainings" ON public.training_events
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_update_trainings" ON public.training_events;
CREATE POLICY "tenant_update_trainings" ON public.training_events
  FOR UPDATE USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

-- ========== DOCUMENTS ==========
DROP POLICY IF EXISTS "tenant_select_documents" ON public.documents;
CREATE POLICY "tenant_select_documents" ON public.documents
  FOR SELECT USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_insert_documents" ON public.documents;
CREATE POLICY "tenant_insert_documents" ON public.documents
  FOR INSERT WITH CHECK (
    tenant_id = auth.uid() OR public.is_staff()
  );

DROP POLICY IF EXISTS "tenant_update_documents" ON public.documents;
CREATE POLICY "tenant_update_documents" ON public.documents
  FOR UPDATE USING (
    tenant_id = auth.uid() OR public.is_staff()
  );

-- ============================================================
-- 14. REALTIME — PUBLICAR TABELAS (ignora se já pertencem)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'crm_companies') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_companies;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'crm_contacts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_contacts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'project_tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_tasks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'calendar_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'training_events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.training_events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'documents') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
  END IF;
END;
$$;
