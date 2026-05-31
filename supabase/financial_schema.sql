-- CrepaldiDH ERP - Financial Module Database Schema
-- Matches standard CRM, projects, and contracts entities.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Financial Categories (Categorias de Receitas/Despesas)
CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Financial Payment Methods (Formas de Pagamento)
CREATE TABLE IF NOT EXISTS financial_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- PIX, Boleto, Cartão de Crédito, Transferência, etc.
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Financial Accounts Receivable (Contas a Receber)
CREATE TABLE IF NOT EXISTS financial_accounts_receivable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  service_name TEXT, -- Ex: Treinamento NR01, Mentoria Liderança, etc.
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')),
  payment_method_id UUID REFERENCES financial_payment_methods(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Financial Accounts Payable (Contas a Pagar)
CREATE TABLE IF NOT EXISTS financial_accounts_payable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier TEXT NOT NULL,
  category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')),
  attachment_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Financial Transactions (Fluxo de Caixa Real)
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  transaction_date DATE NOT NULL,
  payment_method_id UUID REFERENCES financial_payment_methods(id) ON DELETE SET NULL,
  receivable_id UUID REFERENCES financial_accounts_receivable(id) ON DELETE SET NULL,
  payable_id UUID REFERENCES financial_accounts_payable(id) ON DELETE SET NULL,
  category_id UUID REFERENCES financial_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Financial Invoices (Notas Fiscais de Cobrança)
CREATE TABLE IF NOT EXISTS financial_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receivable_id UUID NOT NULL REFERENCES financial_accounts_receivable(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  issue_date DATE NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'canceled')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Financial Recurring Rules (Controle de Mensalidades e Recorrências)
CREATE TABLE IF NOT EXISTS financial_recurring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual')),
  amount DECIMAL(12,2) NOT NULL,
  next_billing_date DATE NOT NULL,
  readjustment_rate DECIMAL(5,2) DEFAULT 0.00, -- Reajuste (ex: 5.50%)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_recurring_rules ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Authenticated users can CRUD financial_categories" ON financial_categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD financial_payment_methods" ON financial_payment_methods FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD financial_accounts_receivable" ON financial_accounts_receivable FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD financial_accounts_payable" ON financial_accounts_payable FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD financial_transactions" ON financial_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD financial_invoices" ON financial_invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can CRUD financial_recurring_rules" ON financial_recurring_rules FOR ALL TO authenticated USING (true);

-- Triggers for automatic updated_at
CREATE TRIGGER update_financial_categories_modtime BEFORE UPDATE ON financial_categories FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_accounts_receivable_modtime BEFORE UPDATE ON financial_accounts_receivable FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_accounts_payable_modtime BEFORE UPDATE ON financial_accounts_payable FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_financial_invoices_modtime BEFORE UPDATE ON financial_invoices FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_recurring_rules_modtime BEFORE UPDATE ON financial_recurring_rules FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
