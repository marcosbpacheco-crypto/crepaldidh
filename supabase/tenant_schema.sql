-- CrepaldiDH Multi-Tenant Schema
-- Extends the base schema with full tenant isolation

-- 1. TENANT PLANS
CREATE TABLE IF NOT EXISTS tenant_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  max_users INTEGER NOT NULL,
  max_clients INTEGER NOT NULL,
  max_projects INTEGER NOT NULL,
  storage_limit_mb INTEGER NOT NULL,
  has_ai BOOLEAN DEFAULT false,
  has_portal BOOLEAN DEFAULT false,
  has_reports BOOLEAN DEFAULT false,
  monthly_price DECIMAL(10,2) NOT NULL,
  annual_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TENANTS
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  plan_id UUID REFERENCES tenant_plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  max_users INTEGER DEFAULT 10,
  storage_limit_mb INTEGER DEFAULT 5000,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  renewal_date TIMESTAMPTZ,
  responsible_name VARCHAR(255),
  responsible_email VARCHAR(255),
  responsible_phone VARCHAR(20),
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TENANT USAGE (daily snapshots)
CREATE TABLE IF NOT EXISTS tenant_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  metric VARCHAR(50) NOT NULL,
  value INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TENANT BILLING
CREATE TABLE IF NOT EXISTS tenant_billing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50),
  amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TENANT SETTINGS
CREATE TABLE IF NOT EXISTS tenant_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  theme_color VARCHAR(7) DEFAULT '#7C3AED',
  logo_url TEXT,
  custom_domain VARCHAR(255),
  allowed_ips TEXT[],
  session_timeout_minutes INTEGER DEFAULT 480,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ADD tenant_id TO EXISTING TABLES
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE trainings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE mentorships ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE proposals ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 7. RLS POLICIES
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Super admins (CrepaldiDH internal) see all tenants
CREATE POLICY "Super admins see all tenants" ON tenants FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tenant admins see only their own tenant
CREATE POLICY "Tenant admins see own tenant" ON tenants FOR SELECT TO authenticated
  USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Tenant usage: super admin sees all, tenant sees own
CREATE POLICY "Super admins see all usage" ON tenant_usage FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Tenant sees own usage" ON tenant_usage FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Tenant billing: same pattern
CREATE POLICY "Super admins see all billing" ON tenant_billing FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Tenant sees own billing" ON tenant_billing FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Tenant settings: super admin manages, tenant reads own
CREATE POLICY "Super admins manage settings" ON tenant_settings FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Tenant reads own settings" ON tenant_settings FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Tenant-isolated RLS on main tables (companies, projects, etc.)
-- Each policy checks that the user's tenant_id matches the row's tenant_id
CREATE POLICY "Users see own tenant companies" ON companies FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users see own tenant contacts" ON contacts FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users see own tenant projects" ON projects FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users see own tenant tasks" ON tasks FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users see own tenant trainings" ON trainings FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users see own tenant mentorships" ON mentorships FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users see own tenant proposals" ON proposals FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users see own tenant contracts" ON contracts FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users see own tenant financial" ON financial_transactions FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Users see own tenant documents" ON documents FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Drop the old permissive policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can CRUD companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can CRUD contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can CRUD projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can CRUD tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can CRUD trainings" ON trainings;
DROP POLICY IF EXISTS "Authenticated users can CRUD mentorships" ON mentorships;
DROP POLICY IF EXISTS "Authenticated users can CRUD proposals" ON proposals;
DROP POLICY IF EXISTS "Authenticated users can CRUD contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can CRUD financial_transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Authenticated users can CRUD documents" ON documents;

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan_id ON tenants(plan_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant ON tenant_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_metric ON tenant_usage(metric);
CREATE INDEX IF NOT EXISTS idx_tenant_billing_tenant ON tenant_billing(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_tenant ON companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_tenant ON financial_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
