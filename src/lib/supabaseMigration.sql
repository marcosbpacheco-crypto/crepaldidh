-- =============================================
-- CrepaldiDH ERP — Full Supabase Migration
-- Execute in Supabase SQL Editor (Ctrl+Enter)
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. ADMIN MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL UNIQUE,
  label varchar(100) NOT NULL,
  description text,
  is_external boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id varchar(255) PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  phone varchar(50) DEFAULT '',
  avatar varchar(10) DEFAULT '',
  role_id varchar(50),
  role_name varchar(100) NOT NULL,
  is_external boolean DEFAULT false,
  company_id varchar(255),
  company_name varchar(255),
  active boolean DEFAULT true,
  password text,
  last_login timestamptz,
  login_attempts integer DEFAULT 0,
  mfa_enabled boolean DEFAULT false,
  tenant_id varchar(100),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id varchar(255) PRIMARY KEY,
  role_id varchar(50),
  user_id varchar(255),
  module varchar(100) NOT NULL,
  can_view boolean DEFAULT false,
  can_create boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_export boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT perm_target CHECK (role_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id varchar(255),
  user_name varchar(255),
  user_role varchar(100),
  action varchar(100) NOT NULL,
  entity varchar(100) NOT NULL,
  entity_id varchar(255),
  description text,
  ip_address varchar(50) DEFAULT '127.0.0.1',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_lgpd_consents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id varchar(255) NOT NULL,
  consent_type varchar(100) NOT NULL,
  legal_basis varchar(100) NOT NULL,
  granted boolean DEFAULT false,
  granted_at timestamptz,
  revoked_at timestamptz,
  version varchar(50) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_privacy_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id varchar(255) NOT NULL,
  user_name varchar(255) NOT NULL,
  request_type varchar(100) NOT NULL,
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  description text,
  processed_by varchar(255),
  processed_at timestamptz,
  response_notes text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. CRM MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS crm_companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  trade_name varchar(255),
  cnpj varchar(20),
  segment varchar(100),
  employees integer DEFAULT 0,
  city varchar(100),
  state varchar(50),
  website varchar(255),
  instagram varchar(255),
  resp_principal varchar(255),
  resp_rh varchar(255),
  resp_financeiro varchar(255),
  phone varchar(50),
  email varchar(255),
  notes text,
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  role varchar(100),
  phone varchar(50),
  whatsapp varchar(50),
  email varchar(255),
  birthday date,
  influence varchar(20) CHECK (influence IN ('high','medium','low')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_deals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  service varchar(100),
  value numeric(12,2) DEFAULT 0,
  stage varchar(100) NOT NULL,
  seller_id varchar(255),
  notes text,
  due_date date,
  lost_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_proposals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  service varchar(100) NOT NULL,
  value numeric(12,2) DEFAULT 0,
  duration varchar(100),
  status varchar(50) DEFAULT 'draft' CHECK (status IN ('draft','sent','negotiation','approved','rejected')),
  notes text,
  generated_content text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES crm_proposals(id) ON DELETE SET NULL,
  title varchar(255) NOT NULL,
  value numeric(12,2) DEFAULT 0,
  start_date date,
  end_date date,
  auto_renew boolean DEFAULT false,
  status varchar(50) DEFAULT 'draft' CHECK (status IN ('draft','active','expired','terminated')),
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES crm_deals(id) ON DELETE SET NULL,
  type varchar(50) NOT NULL CHECK (type IN ('call','meeting','whatsapp','email','visit','proposal','contract','comment')),
  title varchar(255) NOT NULL,
  description text,
  author varchar(255),
  date timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES crm_deals(id) ON DELETE SET NULL,
  title varchar(255) NOT NULL,
  due_date date,
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  priority varchar(20) DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 3. CLIENTS MODULE (gestao de contratos ativos)
-- =============================================
CREATE TABLE IF NOT EXISTS client_list (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id varchar(255),
  company_name varchar(255) NOT NULL,
  company_trade_name varchar(255),
  cnpj varchar(20),
  segment varchar(100),
  city varchar(100),
  state varchar(50),
  services jsonb DEFAULT '[]'::jsonb,
  contract_type varchar(50) DEFAULT 'first' CHECK (contract_type IN ('first','renewal')),
  internal_responsible varchar(255),
  status varchar(50) DEFAULT 'active' CHECK (status IN ('active','suspended','churned')),
  start_date date,
  end_date date,
  monthly_value numeric(12,2) DEFAULT 0,
  total_value numeric(12,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_client_list_deleted_at ON client_list(deleted_at);

CREATE TABLE IF NOT EXISTS client_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES client_list(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  role varchar(100),
  phone varchar(50),
  email varchar(255),
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_interactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES client_list(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL CHECK (type IN ('call','meeting','whatsapp','email','visit','support')),
  title varchar(255) NOT NULL,
  description text,
  author varchar(255),
  date timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES client_list(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  url text,
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_feedbacks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid NOT NULL REFERENCES client_list(id) ON DELETE CASCADE,
  score integer CHECK (score BETWEEN 0 AND 10),
  comment text,
  date timestamptz DEFAULT now()
);

-- =============================================
-- 4. NR01 / DIAGNOSTICS MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS nr01_projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES client_list(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES crm_contracts(id) ON DELETE SET NULL,
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
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nr01_diagnostics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES nr01_projects(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  status varchar(50) DEFAULT 'planejamento' CHECK (status IN ('planejamento','coleta','analise','matriz','plano','monitoramento','concluido')),
  objective text,
  methodology text,
  observations text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nr01_units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_id uuid NOT NULL REFERENCES nr01_diagnostics(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nr01_sectors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id uuid NOT NULL REFERENCES nr01_units(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nr01_risks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sector_id uuid NOT NULL REFERENCES nr01_sectors(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  severity integer CHECK (severity BETWEEN 1 AND 5),
  probability integer CHECK (probability BETWEEN 1 AND 5),
  level varchar(10) CHECK (level IN ('low','medium','high')),
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nr01_evidences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_id uuid NOT NULL REFERENCES nr01_risks(id) ON DELETE CASCADE,
  file_url varchar(1024) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nr01_action_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_id uuid NOT NULL REFERENCES nr01_risks(id) ON DELETE CASCADE,
  task varchar(255) NOT NULL,
  deadline date,
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending','completed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nr01_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_id uuid NOT NULL REFERENCES nr01_diagnostics(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  pdf_url varchar(1024) NOT NULL,
  generated_at timestamptz DEFAULT now()
);

-- =============================================
-- 5. FINANCIAL MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS financial_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense')),
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_payment_methods (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_accounts_receivable (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES crm_companies(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES crm_contracts(id) ON DELETE SET NULL,
  project_id uuid REFERENCES nr01_projects(id) ON DELETE SET NULL,
  service_name text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  payment_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','canceled')),
  payment_method_id uuid REFERENCES financial_payment_methods(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_accounts_payable (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier text NOT NULL,
  category_id uuid REFERENCES financial_categories(id) ON DELETE SET NULL,
  description text,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  payment_date date,
  status text DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','canceled')),
  attachment_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense')),
  transaction_date date NOT NULL,
  payment_method_id uuid REFERENCES financial_payment_methods(id) ON DELETE SET NULL,
  receivable_id uuid REFERENCES financial_accounts_receivable(id) ON DELETE SET NULL,
  payable_id uuid REFERENCES financial_accounts_payable(id) ON DELETE SET NULL,
  category_id uuid REFERENCES financial_categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  receivable_id uuid NOT NULL REFERENCES financial_accounts_receivable(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  issue_date date NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','canceled')),
  file_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_recurring_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid NOT NULL REFERENCES crm_contracts(id) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('monthly','bimonthly','quarterly','semiannual','annual')),
  amount numeric(12,2) NOT NULL,
  next_billing_date date NOT NULL,
  readjustment_rate numeric(5,2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','canceled')),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 6. MENTORING MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS competencies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  description text,
  category varchar(100),
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS development_tools (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  category varchar(100),
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentoring_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  company_id uuid REFERENCES crm_companies(id) ON DELETE SET NULL,
  company_name varchar(255) NOT NULL,
  unit varchar(255),
  sector varchar(255),
  role varchar(255) NOT NULL,
  direct_leader varchar(255),
  email varchar(255) NOT NULL,
  phone varchar(50),
  start_date date NOT NULL,
  notes text,
  avatar varchar(10),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentoring_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type varchar(50) NOT NULL CHECK (type IN ('individual','coletiva','lideranca','executiva')),
  title varchar(255) NOT NULL,
  date timestamptz NOT NULL,
  duration integer NOT NULL,
  objective text,
  topics text,
  action_plan text,
  next_steps text,
  insights text,
  challenges text,
  potentials text,
  status varchar(50) DEFAULT 'agendada' CHECK (status IN ('agendada','realizada','cancelada')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_participants (
  session_id uuid REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, participant_id)
);

CREATE TABLE IF NOT EXISTS tool_usages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_id uuid REFERENCES development_tools(id) ON DELETE CASCADE,
  session_id uuid REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  result text,
  date timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pdi_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  period varchar(100),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pdi_goals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdi_id uuid REFERENCES pdi_plans(id) ON DELETE CASCADE,
  competency varchar(255) NOT NULL,
  objective text NOT NULL,
  action text NOT NULL,
  responsible varchar(255) NOT NULL,
  deadline date NOT NULL,
  indicator text,
  status varchar(50) DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado','em_andamento','concluido','atrasado')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentoring_assessments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL CHECK (type IN ('autoavaliacao','lider','180','360')),
  evaluator_id varchar(255),
  date date NOT NULL,
  observations text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id uuid REFERENCES mentoring_assessments(id) ON DELETE CASCADE,
  competency_id uuid REFERENCES competencies(id) ON DELETE CASCADE,
  score integer CHECK (score BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mentoring_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL CHECK (type IN ('individual','lideranca','evolucao','executivo')),
  title varchar(255) NOT NULL,
  pdf_url varchar(1024),
  generated_at timestamptz DEFAULT now()
);

-- =============================================
-- 7. OCCUPATIONAL HEALTH MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS occupational_clinics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  cnpj text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  contact_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_doctors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  crm text NOT NULL,
  crm_uf text,
  specialty text,
  clinic_id uuid REFERENCES occupational_clinics(id) ON DELETE SET NULL,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_exam_types (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('admissional','periodico','retorno','mudanca','demissional','complementar')),
  description text,
  validity_months integer DEFAULT 12,
  required_for text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_pcmso (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  coordinator_doctor_id uuid REFERENCES occupational_doctors(id) ON DELETE SET NULL,
  coordinator_doctor_name text,
  clinical_director_id uuid REFERENCES occupational_doctors(id) ON DELETE SET NULL,
  clinical_director_name text,
  program_type text DEFAULT 'completo' CHECK (program_type IN ('completo','simplificado','setorial')),
  risk_classification text,
  total_employees integer DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  renewal_date date,
  status text DEFAULT 'vigente' CHECK (status IN ('vigente','vencido','cancelado','rascunho')),
  objectives text,
  scope text,
  methodology text,
  notes text,
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_employees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  pcmso_id uuid REFERENCES occupational_pcmso(id) ON DELETE SET NULL,
  name text NOT NULL,
  cpf text,
  rg text,
  birth_date date,
  gender text CHECK (gender IN ('masculino','feminino','outros')),
  marital_status text,
  email text,
  phone text,
  unit text,
  sector text,
  role text,
  function_description text,
  admission_date date,
  work_regime text CHECK (work_regime IN ('clt','estagio','temporario','terceiro')),
  registration_number text,
  shift text,
  is_leader boolean DEFAULT false,
  direct_leader text,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo','afastado','ferias','desligado')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_asos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  pcmso_id uuid REFERENCES occupational_pcmso(id) ON DELETE SET NULL,
  aso_number text NOT NULL,
  exam_type text NOT NULL CHECK (exam_type IN ('admissional','periodico','retorno','mudanca_funcao','demissional')),
  issue_date date NOT NULL,
  validity_date date,
  doctor_id uuid REFERENCES occupational_doctors(id) ON DELETE SET NULL,
  doctor_name text,
  clinic_id uuid REFERENCES occupational_clinics(id) ON DELETE SET NULL,
  clinic_name text,
  result text NOT NULL CHECK (result IN ('apto','apto_com_restricoes','inapto')),
  restriction_description text,
  observation text,
  exams_summary text,
  pdf_url text,
  digital_signature boolean DEFAULT false,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo','vencido','cancelado')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_exams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  aso_id uuid REFERENCES occupational_asos(id) ON DELETE SET NULL,
  exam_type_id uuid REFERENCES occupational_exam_types(id) ON DELETE SET NULL,
  exam_type_name text NOT NULL,
  exam_category text NOT NULL CHECK (exam_category IN ('admissional','periodico','retorno','mudanca','demissional','complementar')),
  clinic_id uuid REFERENCES occupational_clinics(id) ON DELETE SET NULL,
  clinic_name text,
  doctor_id uuid REFERENCES occupational_doctors(id) ON DELETE SET NULL,
  doctor_name text,
  request_date date NOT NULL,
  exam_date date,
  due_date date NOT NULL,
  result_date date,
  result text CHECK (result IN ('normal','alterado','inconclusivo','nao_realizado')),
  result_details text,
  file_url text,
  status text DEFAULT 'agendado' CHECK (status IN ('agendado','realizado','cancelado','nao_compareceu','reagendado')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_medical_certificates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  cid text,
  cid_description text,
  diagnosis text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_count integer NOT NULL,
  doctor_name text,
  doctor_crm text,
  certificate_type text DEFAULT 'doenca' CHECK (certificate_type IN ('doenca','acidente','tratamento','acompanhamento','gestante')),
  file_url text,
  medical_leave boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_absences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  certificate_id uuid REFERENCES occupational_medical_certificates(id) ON DELETE SET NULL,
  absence_type text NOT NULL CHECK (absence_type IN ('doenca','acidente_trabalho','acidente_trajeto','doenca_ocupacional','maternidade','paternidade','licenca_medica','outros')),
  cid text,
  cid_description text,
  start_date date NOT NULL,
  end_date date,
  expected_return_date date,
  days_count integer,
  cat_issued boolean DEFAULT false,
  cat_number text,
  benefit_type text CHECK (benefit_type IN ('auxilio_doenca','auxilio_acidente','aposentadoria','nenhum')),
  status text DEFAULT 'ativo' CHECK (status IN ('ativo','prorrogado','encerrado','convertido_aposentadoria')),
  documents text[],
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_return_to_work (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  absence_id uuid REFERENCES occupational_absences(id) ON DELETE SET NULL,
  return_date date NOT NULL,
  return_type text NOT NULL CHECK (return_type IN ('normal','gradual','reabilitacao','readaptacao')),
  gradual_hours integer,
  gradual_days integer,
  doctor_recommendations text,
  restrictions text,
  follow_up_required boolean DEFAULT false,
  follow_up_date date,
  aso_id uuid REFERENCES occupational_asos(id) ON DELETE SET NULL,
  status text DEFAULT 'planejado' CHECK (status IN ('planejado','em_andamento','concluido','cancelado')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_restrictions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id uuid NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  aso_id uuid REFERENCES occupational_asos(id) ON DELETE SET NULL,
  restriction_type text NOT NULL CHECK (restriction_type IN ('permanente','temporaria')),
  restriction text NOT NULL,
  origin text NOT NULL CHECK (origin IN ('aso','medico','ergonomico','legal','outros')),
  start_date date NOT NULL,
  end_date date,
  activities_prevented text,
  recommendations text,
  status text DEFAULT 'ativa' CHECK (status IN ('ativa','encerrada','vencida')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES occupational_employees(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('aso_vencendo','exame_atrasado','exame_agendado','exame_vencendo','retorno_previsto','pcmso_vencendo','afastamento_prolongado','restricao_vencendo')),
  title text NOT NULL,
  description text,
  reference_date date NOT NULL,
  days_offset integer,
  severity text DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  is_read boolean DEFAULT false,
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS occupational_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES crm_companies(id) ON DELETE SET NULL,
  report_type text NOT NULL CHECK (report_type IN ('dashboard','aso','exames','atestados','afastamentos','pcmso','indicadores','personalizado')),
  title text NOT NULL,
  params jsonb,
  pdf_url text,
  generated_at timestamptz DEFAULT now()
);

-- =============================================
-- 8. TRAININGS MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS sipat_programs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  theme varchar(255) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status varchar(50) DEFAULT 'planejado' CHECK (status IN ('planejado','agendado','em_andamento','concluido','cancelado')),
  observations text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES crm_companies(id) ON DELETE CASCADE,
  project_id uuid REFERENCES nr01_projects(id) ON DELETE SET NULL,
  sipat_program_id uuid REFERENCES sipat_programs(id) ON DELETE SET NULL,
  type varchar(50) NOT NULL CHECK (type IN ('Palestra','Treinamento','Workshop','SIPAT','Capacitação','Imersão','Mentoria coletiva')),
  name varchar(255) NOT NULL,
  theme varchar(255) NOT NULL,
  objective text,
  target_audience varchar(255),
  facilitator varchar(255) NOT NULL,
  modality varchar(50) NOT NULL CHECK (modality IN ('presencial','online','hibrido')),
  location varchar(255),
  event_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  hours_duration numeric(5,2) NOT NULL,
  expected_participants integer DEFAULT 0,
  cost numeric(10,2) DEFAULT 0,
  status varchar(50) DEFAULT 'planejado' CHECK (status IN ('planejado','agendado','em_divulgacao','realizado','cancelado','reagendado','concluido')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sipat_schedule (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sipat_program_id uuid NOT NULL REFERENCES sipat_programs(id) ON DELETE CASCADE,
  training_event_id uuid REFERENCES training_events(id) ON DELETE SET NULL,
  day_number integer NOT NULL,
  schedule_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  theme varchar(255) NOT NULL,
  facilitator varchar(255) NOT NULL,
  location varchar(255)
);

CREATE TABLE IF NOT EXISTS training_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  crm_contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  company_name varchar(255) NOT NULL,
  unit varchar(100),
  sector varchar(100),
  role varchar(100),
  email varchar(255),
  phone varchar(50),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES training_participants(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  attendance_status varchar(50) DEFAULT 'ausente' CHECK (attendance_status IN ('presente','ausente','justificado')),
  entry_time timestamptz,
  signature_simple varchar(255),
  justification text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_certificates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id uuid NOT NULL REFERENCES training_participants(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  validation_code varchar(100) UNIQUE NOT NULL,
  pdf_url varchar(255),
  issued_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_feedbacks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES training_participants(id) ON DELETE SET NULL,
  rating_general integer CHECK (rating_general BETWEEN 1 AND 5),
  clarity_content integer CHECK (clarity_content BETWEEN 1 AND 5),
  applicability integer CHECK (applicability BETWEEN 1 AND 5),
  didactics integer CHECK (didactics BETWEEN 1 AND 5),
  organization integer CHECK (organization BETWEEN 1 AND 5),
  nps integer CHECK (nps BETWEEN 0 AND 10),
  comments text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_materials (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  type varchar(50) NOT NULL CHECK (type IN ('slide','apostila','pdf','foto','video','link','dinamica','checklist','evidencia')),
  file_url varchar(255) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
  pdf_url varchar(255),
  recommendations text,
  executive_summary text,
  generated_at timestamptz DEFAULT now()
);

-- =============================================
-- 9. DOCUMENTS MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar(255) NOT NULL,
  description text,
  type varchar(50) NOT NULL CHECK (type IN ('contract','proposal','report','template','certificate','other')),
  file_url text,
  file_size bigint,
  mime_type varchar(100),
  company_id uuid REFERENCES crm_companies(id) ON DELETE SET NULL,
  uploaded_by varchar(255),
  tags text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  uploaded_by varchar(255),
  change_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_access_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id varchar(255),
  user_name varchar(255),
  action varchar(50) NOT NULL CHECK (action IN ('view','download','upload','delete','share')),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 10. CALENDAR MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar(255) NOT NULL,
  description text,
  event_type varchar(50) NOT NULL CHECK (event_type IN ('meeting','training','deadline','reminder','appointment','other')),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  location varchar(255),
  color varchar(20),
  company_id uuid REFERENCES crm_companies(id) ON DELETE SET NULL,
  created_by varchar(255),
  status varchar(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed','tentative','cancelled')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id varchar(255),
  name varchar(255) NOT NULL,
  email varchar(255),
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','tentative')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_reminders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  minutes_before integer NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 11. PORTAL MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS portal_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES crm_companies(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL UNIQUE,
  phone varchar(50),
  role varchar(50) NOT NULL,
  active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  module varchar(100) NOT NULL,
  can_view boolean DEFAULT false,
  can_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES crm_companies(id) ON DELETE CASCADE,
  type varchar(100) NOT NULL,
  description text,
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected')),
  attachments text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  message text,
  type varchar(50) DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES crm_companies(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  event_type varchar(50) NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  all_day boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 12. ASSESSORIA MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS assessoria_diagnostics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa varchar(255) NOT NULL,
  data date,
  status varchar(50) DEFAULT 'rascunho',
  diagnostico text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessoria_okrs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa varchar(255) NOT NULL,
  titulo varchar(255) NOT NULL,
  objetivo text,
  key_results jsonb DEFAULT '[]'::jsonb,
  status varchar(50) DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessoria_swots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa varchar(255) NOT NULL,
  forcas text[],
  fraquezas text[],
  oportunidades text[],
  ameacas text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessoria_action_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa varchar(255) NOT NULL,
  acao varchar(255) NOT NULL,
  prazo date,
  responsavel varchar(255),
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessoria_kpis (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa varchar(255) NOT NULL,
  indicador varchar(255) NOT NULL,
  valor_atual numeric(12,2),
  valor_meta numeric(12,2),
  periodo date,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 13. TEMPORARY ACCESS MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS temporary_accesses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES crm_companies(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status varchar(50) DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS temporary_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_id uuid NOT NULL REFERENCES temporary_accesses(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(50),
  company varchar(255),
  role varchar(100),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS temporary_questionnaires (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  access_id uuid NOT NULL REFERENCES temporary_accesses(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  questions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS temporary_responses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id uuid NOT NULL REFERENCES temporary_questionnaires(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES temporary_users(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '[]'::jsonb,
  submitted_at timestamptz DEFAULT now()
);

-- =============================================
-- 14. TENANT MODULE
-- =============================================
CREATE TABLE IF NOT EXISTS tenant_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL UNIQUE,
  label varchar(255) NOT NULL,
  max_users integer DEFAULT 10,
  max_storage_mb integer DEFAULT 1000,
  features jsonb DEFAULT '[]'::jsonb,
  monthly_price numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  plan_id uuid REFERENCES tenant_plans(id),
  status varchar(50) DEFAULT 'active' CHECK (status IN ('active','suspended','cancelled')),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric varchar(100) NOT NULL,
  value bigint DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_billing (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES tenant_plans(id),
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  paid_at timestamptz,
  status varchar(50) DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue','canceled')),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_companies_name ON crm_companies(name);
CREATE INDEX IF NOT EXISTS idx_crm_companies_status ON crm_companies(status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage);
CREATE INDEX IF NOT EXISTS idx_crm_proposals_company ON crm_proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contracts_company ON crm_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_client_list_status ON client_list(status);
CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_client ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_nr01_diagnostics_project ON nr01_diagnostics(project_id);
CREATE INDEX IF NOT EXISTS idx_nr01_units_diagnostic ON nr01_units(diagnostic_id);
CREATE INDEX IF NOT EXISTS idx_nr01_sectors_unit ON nr01_sectors(unit_id);
CREATE INDEX IF NOT EXISTS idx_nr01_risks_sector ON nr01_risks(sector_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_date ON mentoring_sessions(date);
CREATE INDEX IF NOT EXISTS idx_training_events_company ON training_events(company_id);
CREATE INDEX IF NOT EXISTS idx_training_events_date ON training_events(event_date);
CREATE INDEX IF NOT EXISTS idx_training_participants_event ON training_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_occupational_employees_company ON occupational_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_occupational_asos_employee ON occupational_asos(employee_id);
CREATE INDEX IF NOT EXISTS idx_occupational_exams_employee ON occupational_exams(employee_id);

-- =============================================
-- 15. PROFILES (user metadata linked to auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(50) DEFAULT '',
  avatar varchar(10) DEFAULT '',
  role_id varchar(50) NOT NULL DEFAULT 'role-admin',
  role_name varchar(100) NOT NULL DEFAULT 'Administrador',
  is_external boolean DEFAULT false,
  company_id varchar(255),
  company_name varchar(255),
  active boolean DEFAULT true,
  tenant_id varchar(100),
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-create profile on auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role_id, role_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role_id', 'role-user'),
    COALESCE(NEW.raw_user_meta_data->>'role_name', 'Usuário')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Admin helper (bypasses RLS via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role_name = 'Administrador'
  );
$$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role_name);

-- Profiles-specific RLS (not using generic ALL policy)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS profiles_admin_all ON public.profiles;
CREATE POLICY profiles_admin_all ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- =============================================
-- RLS POLICIES
-- =============================================
-- Enable RLS on all tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'admin_roles','admin_users','admin_permissions','admin_audit_logs','admin_lgpd_consents','admin_privacy_requests',
    'crm_companies','crm_contacts','crm_deals','crm_proposals','crm_contracts','crm_activities','crm_tasks',
    'client_list','client_contacts','client_interactions','client_documents','client_feedbacks',
    'nr01_projects','nr01_diagnostics','nr01_units','nr01_sectors','nr01_risks','nr01_evidences','nr01_action_plans','nr01_reports',
    'financial_categories','financial_payment_methods','financial_accounts_receivable','financial_accounts_payable',
    'financial_transactions','financial_invoices','financial_recurring_rules',
    'competencies','development_tools','mentoring_participants','mentoring_sessions','session_participants',
    'tool_usages','pdi_plans','pdi_goals','mentoring_assessments','assessment_results','mentoring_reports',
    'occupational_clinics','occupational_doctors','occupational_exam_types','occupational_pcmso','occupational_employees',
    'occupational_asos','occupational_exams','occupational_medical_certificates','occupational_absences',
    'occupational_return_to_work','occupational_restrictions','occupational_alerts','occupational_reports',
    'sipat_programs','training_events','sipat_schedule','training_participants','training_attendance',
    'training_certificates','training_feedbacks','training_materials','training_reports',
    'documents','document_versions','document_access_logs',
    'calendar_events','calendar_participants','calendar_reminders',
    'portal_users','portal_permissions','portal_requests','portal_notifications','portal_calendar_events',
    'assessoria_diagnostics','assessoria_okrs','assessoria_swots','assessoria_action_plans','assessoria_kpis',
    'temporary_accesses','temporary_users','temporary_questionnaires','temporary_responses',
    'tenant_plans','tenants','tenant_usage','tenant_billing'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- Grant full access to authenticated users (single-tenant mode)
-- Future: replace USING (true) with tenant isolation
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'admin_roles','admin_users','admin_permissions','admin_audit_logs','admin_lgpd_consents','admin_privacy_requests',
    'crm_companies','crm_contacts','crm_deals','crm_proposals','crm_contracts','crm_activities','crm_tasks',
    'client_list','client_contacts','client_interactions','client_documents','client_feedbacks',
    'nr01_projects','nr01_diagnostics','nr01_units','nr01_sectors','nr01_risks','nr01_evidences','nr01_action_plans','nr01_reports',
    'financial_categories','financial_payment_methods','financial_accounts_receivable','financial_accounts_payable',
    'financial_transactions','financial_invoices','financial_recurring_rules',
    'competencies','development_tools','mentoring_participants','mentoring_sessions','session_participants',
    'tool_usages','pdi_plans','pdi_goals','mentoring_assessments','assessment_results','mentoring_reports',
    'occupational_clinics','occupational_doctors','occupational_exam_types','occupational_pcmso','occupational_employees',
    'occupational_asos','occupational_exams','occupational_medical_certificates','occupational_absences',
    'occupational_return_to_work','occupational_restrictions','occupational_alerts','occupational_reports',
    'sipat_programs','training_events','sipat_schedule','training_participants','training_attendance',
    'training_certificates','training_feedbacks','training_materials','training_reports',
    'documents','document_versions','document_access_logs',
    'calendar_events','calendar_participants','calendar_reminders',
    'portal_users','portal_permissions','portal_requests','portal_notifications','portal_calendar_events',
    'assessoria_diagnostics','assessoria_okrs','assessoria_swots','assessoria_action_plans','assessoria_kpis',
    'temporary_accesses','temporary_users','temporary_questionnaires','temporary_responses',
    'tenant_plans','tenants','tenant_usage','tenant_billing'
  ])
  LOOP
    EXECUTE format('CREATE POLICY %I_all ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- =============================================
-- 16. RLS — POLICIES INDIVIDUAIS (substituem FOR ALL)
-- =============================================
-- Substitui a policy unica FOR ALL por policies separadas
-- por operacao (SELECT, INSERT, UPDATE, DELETE) nas tabelas
-- que sao acessadas diretamente por API routes ou clients.
-- O FOR ALL permanece para as demais tabelas (linhas acima).
-- =============================================

-- client_list
DROP POLICY IF EXISTS client_list_all ON client_list;
CREATE POLICY client_list_select ON client_list FOR SELECT TO authenticated USING (true);
CREATE POLICY client_list_insert ON client_list FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY client_list_update ON client_list FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY client_list_delete ON client_list FOR DELETE TO authenticated USING (true);

-- client_contacts
DROP POLICY IF EXISTS client_contacts_all ON client_contacts;
CREATE POLICY client_contacts_select ON client_contacts FOR SELECT TO authenticated USING (true);
CREATE POLICY client_contacts_insert ON client_contacts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY client_contacts_update ON client_contacts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY client_contacts_delete ON client_contacts FOR DELETE TO authenticated USING (true);

-- client_interactions
DROP POLICY IF EXISTS client_interactions_all ON client_interactions;
CREATE POLICY client_interactions_select ON client_interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY client_interactions_insert ON client_interactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY client_interactions_update ON client_interactions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY client_interactions_delete ON client_interactions FOR DELETE TO authenticated USING (true);

-- client_documents
DROP POLICY IF EXISTS client_documents_all ON client_documents;
CREATE POLICY client_documents_select ON client_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY client_documents_insert ON client_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY client_documents_update ON client_documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY client_documents_delete ON client_documents FOR DELETE TO authenticated USING (true);

-- client_feedbacks
DROP POLICY IF EXISTS client_feedbacks_all ON client_feedbacks;
CREATE POLICY client_feedbacks_select ON client_feedbacks FOR SELECT TO authenticated USING (true);
CREATE POLICY client_feedbacks_insert ON client_feedbacks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY client_feedbacks_update ON client_feedbacks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY client_feedbacks_delete ON client_feedbacks FOR DELETE TO authenticated USING (true);

-- crm_companies (accessed by ProjectContext and cross-sync)
DROP POLICY IF EXISTS crm_companies_all ON crm_companies;
CREATE POLICY crm_companies_select ON crm_companies FOR SELECT TO authenticated USING (true);
CREATE POLICY crm_companies_insert ON crm_companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY crm_companies_update ON crm_companies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY crm_companies_delete ON crm_companies FOR DELETE TO authenticated USING (true);

-- admin_users (password column — restrito a admins via service_role)
DROP POLICY IF EXISTS admin_users_all ON admin_users;
CREATE POLICY admin_users_select ON admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY admin_users_insert ON admin_users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY admin_users_update ON admin_users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY admin_users_delete ON admin_users FOR DELETE TO authenticated USING (true);

-- Observacao: todas as policies acima usam USING (true) / WITH CHECK (true)
-- porque o sistema esta em modo single-tenant. A autenticacao e autorizacao
-- sao feitas no middleware e nas API routes (que usam service_role).
-- Em uma migracao futura para multi-tenant, substituir USING (true) por
-- USING (tenant_id = auth.jwt()->>'tenant_id').

-- projects + project_tasks (acessados pelo ProjectContext via anon key)
DROP POLICY IF EXISTS projects_all ON projects;
CREATE POLICY projects_select ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY projects_insert ON projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY projects_update ON projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY projects_delete ON projects FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS project_tasks_all ON project_tasks;
CREATE POLICY project_tasks_select ON project_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY project_tasks_insert ON project_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY project_tasks_update ON project_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY project_tasks_delete ON project_tasks FOR DELETE TO authenticated USING (true);

-- companies (acessado pelo CompanyForm via anon key)
DROP POLICY IF EXISTS companies_all ON companies;
CREATE POLICY companies_select ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY companies_insert ON companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY companies_update ON companies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY companies_delete ON companies FOR DELETE TO authenticated USING (true);
