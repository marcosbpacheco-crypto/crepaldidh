-- ==========================================
-- ADMIN, PERMISSIONS & LGPD - CrepaldiDH ERP
-- ==========================================

-- 1. ROLES
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  is_external BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar TEXT,
  role_id UUID REFERENCES roles(id),
  is_external BOOLEAN DEFAULT false,
  company_id TEXT,
  active BOOLEAN DEFAULT true,
  blocked_until TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  last_login TIMESTAMPTZ,
  last_ip TEXT,
  mfa_enabled BOOLEAN DEFAULT false,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PERMISSIONS (granular: module + action per role/user)
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id),
  user_id UUID REFERENCES users(id),
  module TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  CONSTRAINT perm_target CHECK (
    (role_id IS NOT NULL AND user_id IS NULL) OR
    (role_id IS NULL AND user_id IS NOT NULL)
  )
);

-- 4. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LGPD_CONSENTS
CREATE TABLE IF NOT EXISTS lgpd_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  consent_type TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  granted BOOLEAN DEFAULT false,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  ip_address TEXT,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. PRIVACY_REQUESTS
CREATE TABLE IF NOT EXISTS privacy_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'deletion', 'portability', 'anonymization', 'restriction')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  description TEXT,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  response_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. DATA_RETENTION_POLICIES
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  auto_delete BOOLEAN DEFAULT false,
  legal_basis TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_lgpd_consents_user ON lgpd_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON privacy_requests(user_id);

-- RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lgpd_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Seed roles
INSERT INTO roles (name, label, description, is_system, is_external) VALUES
('admin', 'Administrador', 'Acesso total ao sistema', true, false),
('director', 'Diretor', 'Acesso a todos os módulos sem configurações', true, false),
('consultant', 'Consultor', 'Acesso a CRM, NR01, mentorias, treinamentos, documentos', true, false),
('commercial', 'Comercial', 'Acesso a CRM, propostas, pipeline comercial', true, false),
('finance', 'Financeiro', 'Acesso a financeiro, cobranças, relatórios financeiros', true, false),
('rh', 'RH', 'Acesso a treinamentos, agenda, documentos de RH', true, false),
('operational', 'Operacional', 'Acesso a projetos, NR01, documentos técnicos', true, false),
('client_rh', 'Cliente - RH', 'Acesso ao portal como RH do cliente', true, true),
('client_director', 'Cliente - Diretoria', 'Acesso ao portal como diretoria do cliente', true, true),
('client_manager', 'Cliente - Gestor', 'Acesso ao portal como gestor do cliente', true, true),
('client_finance', 'Cliente - Financeiro', 'Acesso ao portal como financeiro do cliente', true, true);

-- Seed permissions
INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, true, true, true, true, true
FROM roles r
CROSS JOIN (VALUES ('crm'), ('clients'), ('projects'), ('nr01'), ('mentoring'), ('trainings'), ('financial'), ('calendar'), ('portal'), ('documents'), ('bi'), ('ai'), ('admin')) AS m(module)
WHERE r.name = 'admin';

INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, true, true, true, false, true
FROM roles r
CROSS JOIN (VALUES ('crm'), ('clients'), ('projects'), ('nr01'), ('mentoring'), ('trainings'), ('financial'), ('calendar'), ('documents'), ('bi'), ('ai')) AS m(module)
WHERE r.name = 'director';

INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, true, true, true, false, false
FROM roles r
CROSS JOIN (VALUES ('crm'), ('projects'), ('nr01'), ('mentoring'), ('trainings'), ('documents')) AS m(module)
WHERE r.name = 'consultant';

INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, true, true, false, false, false
FROM roles r
CROSS JOIN (VALUES ('crm'), ('clients')) AS m(module)
WHERE r.name = 'commercial';

INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, true, true, false, false, true
FROM roles r
CROSS JOIN (VALUES ('financial'), ('crm')) AS m(module)
WHERE r.name = 'finance';

INSERT INTO permissions (role_id, module, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.module, true, true, true, false, false
FROM roles r
CROSS JOIN (VALUES ('trainings'), ('calendar'), ('documents')) AS m(module)
WHERE r.name = 'rh';

-- Seed retention policies
INSERT INTO data_retention_policies (entity_type, retention_days, auto_delete, legal_basis) VALUES
('audit_logs', 1825, true, 'Legítimo interesse'),
('sessions', 90, true, 'Segurança'),
('lgpd_consents', 7300, true, 'Obrigação legal'),
('privacy_requests', 1825, true, 'Obrigação legal'),
('users_inactive', 365, false, 'LGPD Art. 15');
