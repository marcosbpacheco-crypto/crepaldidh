/* Supabase schema for CrepaldiDH ERP NR01 & Psychosocial Diagnosis module */

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Clients (active clients generated from contracts)
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  status varchar(20) NOT NULL CHECK (status IN ('active', 'churned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Projects (linked to a client and a contract)
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  type varchar(50) NOT NULL,
  description text,
  objective text,
  responsible varchar(255),
  start_date date,
  end_date date,
  status varchar(30) NOT NULL,
  priority varchar(20),
  value numeric(12,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Diagnostics (NR01 / Psychosocial)
CREATE TABLE IF NOT EXISTS diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  status varchar(20) NOT NULL CHECK (status IN ('planejamento','coleta','analise','matriz','plano','monitoramento','concluido')),
  objective text,
  methodology text,
  observations text
);

-- 4. Units (organizational units within a client)
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id uuid NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Sectors (sub‑units of a unit)
CREATE TABLE IF NOT EXISTS sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Risks (linked to a sector)
CREATE TABLE IF NOT EXISTS risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id uuid NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  severity int NOT NULL CHECK (severity BETWEEN 1 AND 5),
  probability int NOT NULL CHECK (probability BETWEEN 1 AND 5),
  level varchar(10) NOT NULL CHECK (level IN ('low','medium','high')),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Evidences (files attached to a risk)
CREATE TABLE IF NOT EXISTS evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id uuid NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  file_url varchar(1024) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Action Plans (tasks to mitigate a risk)
CREATE TABLE IF NOT EXISTS action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id uuid NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  task varchar(255) NOT NULL,
  deadline date,
  status varchar(20) NOT NULL CHECK (status IN ('pending','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Reports (final PDF report per diagnostic)
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id uuid NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  pdf_url varchar(1024) NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for faster look‑ups
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_project_id ON diagnostics(project_id);
CREATE INDEX IF NOT EXISTS idx_units_diagnostic_id ON units(diagnostic_id);
CREATE INDEX IF NOT EXISTS idx_sectors_unit_id ON sectors(unit_id);
CREATE INDEX IF NOT EXISTS idx_risks_sector_id ON risks(sector_id);
CREATE INDEX IF NOT EXISTS idx_evidences_risk_id ON evidences(risk_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_risk_id ON action_plans(risk_id);
CREATE INDEX IF NOT EXISTS idx_reports_diag_id ON reports(diagnostic_id);
