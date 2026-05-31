-- CrepaldiDH SaaS/ERP - Full Database Schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------------------
-- 1. PROFILES (Users)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 2. COMPANIES (Empresas Clientes)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  trade_name TEXT,
  document_number TEXT UNIQUE, -- CNPJ/CPF
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 3. CONTACTS (Contatos nas empresas)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 4. PROJECTS (Projetos)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'on_hold', 'completed', 'canceled')),
  start_date DATE,
  end_date DATE,
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 5. TASKS (Tarefas)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 6. TRAININGS (Treinamentos)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS trainings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  instructor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 7. MENTORSHIPS (Mentorias)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  mentor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  mentee_contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE, -- Assuming mentee is a contact from a company
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'canceled')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 8. PROPOSALS (Propostas)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
  valid_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 9. CONTRACTS (Contratos)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 10. FINANCIAL TRANSACTIONS (Financeiro)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- 11. DOCUMENTS (Documentos)
-----------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- e.g., 'company', 'project', 'contract', 'proposal'
  entity_id UUID NOT NULL,   -- The ID of the related record
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-----------------------------------------------------------
-- RLS (ROW LEVEL SECURITY)
-----------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Basic Policies: Only authenticated users can access the data.
-- (For a real multi-tenant SaaS, you'd restrict rows by company_id, but here we assume internal CRM use)
CREATE POLICY "Authenticated users can select profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Authenticated users can CRUD companies" ON companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD contacts" ON contacts FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD projects" ON projects FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD tasks" ON tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD trainings" ON trainings FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD mentorships" ON mentorships FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD proposals" ON proposals FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD contracts" ON contracts FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD financial_transactions" ON financial_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD documents" ON documents FOR ALL TO authenticated USING (true);

-- Triggers for updated_at (Optional but recommended)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_companies_modtime BEFORE UPDATE ON companies FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_contacts_modtime BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_trainings_modtime BEFORE UPDATE ON trainings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_mentorships_modtime BEFORE UPDATE ON mentorships FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_proposals_modtime BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_contracts_modtime BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_financial_modtime BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
