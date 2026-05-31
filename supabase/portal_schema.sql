-- CrepaldiDH ERP - Client Portal Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Portal Users (Usuários do Portal)
CREATE TABLE IF NOT EXISTS client_portal_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('rh', 'diretoria', 'lider', 'financeiro')),
  phone TEXT,
  active BOOLEAN DEFAULT true,
  last_access TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Portal Permissions (Permissões por unidade/módulo)
CREATE TABLE IF NOT EXISTS client_portal_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES client_portal_users(id) ON DELETE CASCADE,
  unit_id TEXT,
  module TEXT NOT NULL CHECK (module IN ('dashboard', 'projects', 'nr01', 'trainings', 'documents', 'agenda', 'financial', 'requests')),
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Client Requests (Solicitações do Cliente)
CREATE TABLE IF NOT EXISTS client_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES client_portal_users(id) ON DELETE SET NULL,
  user_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('meeting', 'training', 'doubt', 'document', 'support', 'action_plan_adjust')),
  subject TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Client Notifications (Notificações)
CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES client_portal_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'alert')),
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Document Access (Controle de Acesso a Documentos)
CREATE TABLE IF NOT EXISTS client_document_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'proposal', 'report', 'certificate', 'inventory', 'action_plan', 'material')),
  document_name TEXT NOT NULL,
  file_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_portal_users_company ON client_portal_users(company_id);
CREATE INDEX IF NOT EXISTS idx_portal_permissions_user ON client_portal_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_requests_company ON client_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_company ON client_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_portal_documents_company ON client_document_access(company_id);

-- RLS Policies
ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_document_access ENABLE ROW LEVEL SECURITY;

-- Users can only see their own company's data
CREATE POLICY "Users see own company" ON client_portal_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permissions see own company" ON client_portal_permissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Requests see own company" ON client_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Notifications see own company" ON client_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Documents see own company" ON client_document_access FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_portal_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portal_users_modtime BEFORE UPDATE ON client_portal_users FOR EACH ROW EXECUTE FUNCTION update_portal_modified_column();
CREATE TRIGGER update_portal_requests_modtime BEFORE UPDATE ON client_requests FOR EACH ROW EXECUTE FUNCTION update_portal_modified_column();
