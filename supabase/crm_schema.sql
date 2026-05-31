-- Supabase CRM Schema
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  segment TEXT,
  employees_count INTEGER,
  city TEXT,
  state TEXT,
  website TEXT,
  instagram TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_companies_status ON companies(status);

-- 2. contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  birthday DATE,
  decision_influence TEXT NOT NULL DEFAULT 'medium' CHECK (decision_influence IN ('high','medium','low')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_influence ON contacts(decision_influence);

-- 3. leads (deals)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  source TEXT,
  service_interest TEXT,
  pipeline_stage TEXT NOT NULL DEFAULT 'Lead novo' CHECK (pipeline_stage IN (
    'Lead novo','Primeiro contato','Reunião agendada','Diagnóstico realizado','Proposta enviada','Negociação','Contrato aprovado','Implantação','Cliente ativo','Renovação','Cliente perdido'
  )),
  estimated_value NUMERIC(12,2),
  probability NUMERIC(5,2) CHECK (probability >= 0 AND probability <= 100),
  responsible_user_id UUID REFERENCES auth.users(id),
  expected_close_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','won','lost')),
  lost_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_stage ON leads(pipeline_stage);
CREATE INDEX idx_leads_status ON leads(status);

-- 4. interactions (activities)
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('call','meeting','whatsapp','email','visit','proposal','contract','note')),
  title TEXT NOT NULL,
  description TEXT,
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_action TEXT,
  follow_up_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_interactions_company ON interactions(company_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_interactions_lead ON interactions(lead_id);

-- 5. proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  service_type TEXT,
  value NUMERIC(12,2),
  validity_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','negotiation','approved','rejected')),
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_proposals_company ON proposals(company_id);
CREATE INDEX idx_proposals_status ON proposals(status);

-- 6. contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  value NUMERIC(12,2),
  renewal_type TEXT CHECK (renewal_type IN ('automatic','manual','none')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','expired','terminated')),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_contracts_company ON contracts(company_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- 7. crm_tasks
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_tasks_company ON crm_tasks(company_id);
CREATE INDEX idx_tasks_status ON crm_tasks(status);
CREATE INDEX idx_tasks_priority ON crm_tasks(priority);

-- -----------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------
-- Enable RLS on all CRM tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

-- Policies (basic: any authenticated user can read/write)
CREATE POLICY "allow_read" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON companies FOR INSERT, UPDATE, DELETE TO authenticated WITH CHECK (true);

CREATE POLICY "allow_read" ON contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON contacts FOR INSERT, UPDATE, DELETE TO authenticated WITH CHECK (true);

CREATE POLICY "allow_read" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON leads FOR INSERT, UPDATE, DELETE TO authenticated WITH CHECK (true);

CREATE POLICY "allow_read" ON interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON interactions FOR INSERT, UPDATE, DELETE TO authenticated WITH CHECK (true);

CREATE POLICY "allow_read" ON proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON proposals FOR INSERT, UPDATE, DELETE TO authenticated WITH CHECK (true);

CREATE POLICY "allow_read" ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON contracts FOR INSERT, UPDATE, DELETE TO authenticated WITH CHECK (true);

CREATE POLICY "allow_read" ON crm_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_write" ON crm_tasks FOR INSERT, UPDATE, DELETE TO authenticated WITH CHECK (true);

-- -----------------------------------------------------------------
-- Triggers to keep updated_at in sync
-- -----------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_companies_updated BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_contacts_updated BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_leads_updated BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_interactions_updated BEFORE UPDATE ON interactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_proposals_updated BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_contracts_updated BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trigger_tasks_updated BEFORE UPDATE ON crm_tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------------------------
-- Sample seed data (for local testing)
-- -----------------------------------------------------------------
INSERT INTO companies (name, legal_name, cnpj, segment, employees_count, city, state, website, instagram, status, notes)
VALUES
('Petrobras Distribuidora S.A.', 'BR Distribuidora', '34.270.868/0001-98', 'Energia/Combustíveis', 1500, 'Rio de Janeiro', 'RJ', 'https://br.com.br', '@brdistribuidora', 'active', 'Cliente de grande porte.');

INSERT INTO contacts (company_id, name, role, phone, whatsapp, email, birthday, decision_influence, notes)
SELECT id, 'Carlos Silva', 'Gerente de HSE', '(21) 98765-4321', '(21) 98765-4321', 'carlos.silva@br.com.br', '1978-08-14', 'high', 'Decisor técnico.'
FROM companies WHERE cnpj = '34.270.868/0001-98';

INSERT INTO leads (company_id, source, service_interest, pipeline_stage, estimated_value, probability, responsible_user_id, expected_close_date, status, notes)
SELECT id, 'Website', 'Diagnóstico Psicossocial', 'Lead novo', 48000, 20, auth.uid(), CURRENT_DATE + interval '30 day', 'open', 'Primeiro contato via site.'
FROM companies WHERE cnpj = '34.270.868/0001-98';

INSERT INTO proposals (company_id, lead_id, title, service_type, value, validity_date, status, pdf_url, notes)
SELECT c.id, l.id, 'Proposta Diagnóstico Psicossocial', 'Diagnóstico Psicossocial', 48000, CURRENT_DATE + interval '15 day', 'draft', NULL, 'A ser revisada.'
FROM companies c JOIN leads l ON c.id = l.company_id WHERE c.cnpj = '34.270.868/0001-98';

INSERT INTO contracts (company_id, proposal_id, title, start_date, end_date, value, renewal_type, status, document_url)
SELECT c.id, p.id, 'Contrato Diagnóstico Psicossocial', CURRENT_DATE, CURRENT_DATE + interval '12 month', 48000, 'automatic', 'draft', NULL
FROM companies c JOIN proposals p ON c.id = p.company_id WHERE c.cnpj = '34.270.868/0001-98';

INSERT INTO crm_tasks (company_id, lead_id, title, description, due_date, status, priority, assigned_to)
SELECT c.id, l.id, 'Agendar reunião de diagnóstico', 'Marcar reunião com a área de HSE.', CURRENT_DATE + interval '7 day', 'pending', 'high', auth.uid()
FROM companies c JOIN leads l ON c.id = l.company_id WHERE c.cnpj = '34.270.868/0001-98';

-- End of schema
