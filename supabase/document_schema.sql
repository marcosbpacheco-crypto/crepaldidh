-- ============================================
-- CENTRAL DE DOCUMENTOS - CrepaldiDH ERP
-- Schema: documents, versions, permissions, logs, categories
-- ============================================

-- 1. DOCUMENT CATEGORIES
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'contract','proposal','report','diagnostic','inventory',
    'action_plan','certificate','attendance_list','training_material',
    'evidence','meeting_minutes','financial'
  )),
  description TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  project_id UUID REFERENCES crm_contracts(id) ON DELETE SET NULL,
  module TEXT,
  visibility TEXT NOT NULL DEFAULT 'internal' CHECK (visibility IN (
    'internal','portal','restricted','financial','technical'
  )),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','approved','rejected','archived','expired'
  )),
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  current_version INTEGER NOT NULL DEFAULT 1,
  signature_code TEXT,
  signed_at TIMESTAMPTZ,
  signed_by UUID,
  valid_until DATE,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DOCUMENT VERSIONS
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  change_description TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- 4. DOCUMENT PERMISSIONS
CREATE TABLE IF NOT EXISTS document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID,
  role TEXT CHECK (role IN ('admin','manager','financial','technical','client','director')),
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  UNIQUE(document_id, user_id, role)
);

-- 5. ACCESS LOGS
CREATE TABLE IF NOT EXISTS document_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('view','download','edit','delete','share','upload','version')),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
CREATE INDEX IF NOT EXISTS idx_document_versions_doc ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_doc ON document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_doc ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_action ON document_access_logs(action);

-- RLS Policies
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;

-- Categories: admins manage, all authenticated users view
CREATE POLICY "categories_select" ON document_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "categories_insert" ON document_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "categories_update" ON document_categories FOR UPDATE USING (auth.role() = 'authenticated');

-- Documents: RLS by visibility + permissions
CREATE POLICY "documents_select_internal" ON documents FOR SELECT USING (
  visibility = 'internal' AND auth.role() = 'authenticated'
);
CREATE POLICY "documents_select_portal" ON documents FOR SELECT USING (
  visibility = 'portal' OR visibility = 'internal'
);
CREATE POLICY "documents_select_restricted" ON documents FOR SELECT USING (
  visibility != 'restricted' OR EXISTS (
    SELECT 1 FROM document_permissions WHERE document_id = id AND user_id = auth.uid() AND can_view = true
  )
);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "documents_update" ON documents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "documents_delete" ON documents FOR DELETE USING (
  EXISTS (SELECT 1 FROM document_permissions WHERE document_id = id AND user_id = auth.uid() AND can_delete = true)
);

-- Versions: cascade access from parent document
CREATE POLICY "versions_select" ON document_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents WHERE id = document_id)
);
CREATE POLICY "versions_insert" ON document_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM documents WHERE id = document_id)
);

-- Permissions: seen by admins and self
CREATE POLICY "permissions_select" ON document_permissions FOR SELECT USING (
  user_id = auth.uid() OR EXISTS (SELECT 1 FROM document_permissions WHERE document_id = document_id AND user_id = auth.uid() AND can_edit = true)
);

-- Access logs: insert only, select by document owners
CREATE POLICY "logs_insert" ON document_access_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "logs_select" ON document_access_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents WHERE id = document_id AND created_by = auth.uid())
);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_document_timestamp();

-- Seed categories
INSERT INTO document_categories (name, slug, description, icon, color) VALUES
  ('Contrato', 'contract', 'Contratos com clientes e fornecedores', 'FileText', '#3B82F6'),
  ('Proposta', 'proposal', 'Propostas comerciais enviadas', 'FileText', '#8B5CF6'),
  ('Relatório', 'report', 'Relatórios técnicos e gerenciais', 'FileText', '#06B6D4'),
  ('Diagnóstico', 'diagnostic', 'Diagnósticos organizacionais e psicossociais', 'FileText', '#0EA5E9'),
  ('Inventário', 'inventory', 'Inventários de riscos e patrimônio', 'FileText', '#6366F1'),
  ('Plano de Ação', 'action_plan', 'Planos de ação e melhorias', 'FileText', '#F59E0B'),
  ('Certificado', 'certificate', 'Certificados de treinamentos e capacitações', 'FileText', '#10B981'),
  ('Lista de Presença', 'attendance_list', 'Listas de presença de eventos e treinamentos', 'FileText', '#84CC16'),
  ('Material de Treinamento', 'training_material', 'Apostilas, slides e materiais didáticos', 'FileText', '#14B8A6'),
  ('Evidência', 'evidence', 'Evidências de ações e auditorias', 'FileText', '#EC4899'),
  ('Ata', 'meeting_minutes', 'Atas de reuniões e deliberações', 'FileText', '#F97316'),
  ('Financeiro', 'financial', 'Documentos financeiros, notas e boletos', 'FileText', '#22C55E')
ON CONFLICT (slug) DO NOTHING;
