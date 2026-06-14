-- CrepaldiDH ERP - Occupational Health Module Database Schema
-- Execute in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clinics (clínicas parceiras)
CREATE TABLE IF NOT EXISTS occupational_clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  contact_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Doctors (médicos do trabalho)
CREATE TABLE IF NOT EXISTS occupational_doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  crm TEXT NOT NULL,
  crm_uf TEXT,
  specialty TEXT, -- 'medico_trabalho', 'clinico_geral', 'outros'
  clinic_id UUID REFERENCES occupational_clinics(id) ON DELETE SET NULL,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Exam Types (tipos de exame)
CREATE TABLE IF NOT EXISTS occupational_exam_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- Ex: Audiometria, Acuidade Visual, Eletrocardiograma
  category TEXT NOT NULL CHECK (category IN ('admissional', 'periodico', 'retorno', 'mudanca', 'demissional', 'complementar')),
  description TEXT,
  validity_months INTEGER DEFAULT 12, -- validade padrão em meses
  required_for TEXT[], -- riscos que exigem este exame
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PCMSO Programs
CREATE TABLE IF NOT EXISTS occupational_pcmso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  coordinator_doctor_id UUID REFERENCES occupational_doctors(id) ON DELETE SET NULL,
  coordinator_doctor_name TEXT,
  clinical_director_id UUID REFERENCES occupational_doctors(id) ON DELETE SET NULL,
  clinical_director_name TEXT,
  program_type TEXT NOT NULL DEFAULT 'completo' CHECK (program_type IN ('completo', 'simplificado', 'setorial')),
  risk_classification TEXT, -- '1', '2', '3', '4'
  total_employees INTEGER DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE,
  status TEXT NOT NULL DEFAULT 'vigente' CHECK (status IN ('vigente', 'vencido', 'cancelado', 'rascunho')),
  objectives TEXT,
  scope TEXT,
  methodology TEXT,
  notes TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Occupational Employees (colaboradores do cliente para saúde ocupacional)
CREATE TABLE IF NOT EXISTS occupational_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  pcmso_id UUID REFERENCES occupational_pcmso(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outros')),
  marital_status TEXT,
  email TEXT,
  phone TEXT,
  unit TEXT,
  sector TEXT,
  role TEXT,
  function_description TEXT,
  admission_date DATE,
  work_regime TEXT, -- 'clt', 'estagio', 'temporario', 'terceiro'
  registration_number TEXT, -- matrícula
  shift TEXT, -- 'administrativo', 'turno_a', 'turno_b', 'turno_c', 'noturno'
  is_leader BOOLEAN DEFAULT false,
  direct_leader TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'afastado', 'ferias', 'desligado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ASO (Atestado de Saúde Ocupacional)
CREATE TABLE IF NOT EXISTS occupational_asos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  pcmso_id UUID REFERENCES occupational_pcmso(id) ON DELETE SET NULL,
  aso_number TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('admissional', 'periodico', 'retorno', 'mudanca_funcao', 'demissional')),
  issue_date DATE NOT NULL,
  validity_date DATE,
  doctor_id UUID REFERENCES occupational_doctors(id) ON DELETE SET NULL,
  doctor_name TEXT,
  clinic_id UUID REFERENCES occupational_clinics(id) ON DELETE SET NULL,
  clinic_name TEXT,
  result TEXT NOT NULL CHECK (result IN ('apto', 'apto_com_restricoes', 'inapto')),
  restriction_description TEXT,
  observation TEXT,
  exams_summary TEXT, -- resumo dos exames realizados
  pdf_url TEXT,
  digital_signature BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'vencido', 'cancelado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Occupational Exams (exames realizados)
CREATE TABLE IF NOT EXISTS occupational_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  aso_id UUID REFERENCES occupational_asos(id) ON DELETE SET NULL,
  exam_type_id UUID REFERENCES occupational_exam_types(id) ON DELETE SET NULL,
  exam_type_name TEXT NOT NULL,
  exam_category TEXT NOT NULL CHECK (exam_category IN ('admissional', 'periodico', 'retorno', 'mudanca', 'demissional', 'complementar')),
  clinic_id UUID REFERENCES occupational_clinics(id) ON DELETE SET NULL,
  clinic_name TEXT,
  doctor_id UUID REFERENCES occupational_doctors(id) ON DELETE SET NULL,
  doctor_name TEXT,
  request_date DATE NOT NULL,
  exam_date DATE,
  due_date DATE NOT NULL, -- data limite para realização
  result_date DATE,
  result TEXT CHECK (result IN ('normal', 'alterado', 'inconclusivo', 'nao_realizado')),
  result_details TEXT,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizado', 'cancelado', 'nao_compareceu', 'reagendado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Medical Certificates (atestados médicos)
CREATE TABLE IF NOT EXISTS occupational_medical_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  cid TEXT, -- Código da doença (CID-10)
  cid_description TEXT,
  diagnosis TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  doctor_name TEXT,
  doctor_crm TEXT,
  certificate_type TEXT NOT NULL DEFAULT 'doenca' CHECK (certificate_type IN ('doenca', 'acidente', 'tratamento', 'acompanhamento', 'gestante')),
  file_url TEXT,
  medical_leave BOOLEAN DEFAULT false, -- gerou afastamento?
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Absences (afastamentos)
CREATE TABLE IF NOT EXISTS occupational_absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  certificate_id UUID REFERENCES occupational_medical_certificates(id) ON DELETE SET NULL,
  absence_type TEXT NOT NULL CHECK (absence_type IN ('doenca', 'acidente_trabalho', 'acidente_trajeto', 'doenca_ocupacional', 'maternidade', 'paternidade', 'licenca_medica', 'outros')),
  cid TEXT,
  cid_description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  expected_return_date DATE,
  days_count INTEGER,
  cat_issued BOOLEAN DEFAULT false, -- CAT emitida?
  cat_number TEXT,
  benefit_type TEXT, -- 'auxilio_doenca', 'auxilio_acidente', 'aposentadoria', 'nenhum'
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'prorrogado', 'encerrado', 'convertido_aposentadoria')),
  documents TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Return to Work (retorno ao trabalho)
CREATE TABLE IF NOT EXISTS occupational_return_to_work (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  absence_id UUID REFERENCES occupational_absences(id) ON DELETE SET NULL,
  return_date DATE NOT NULL,
  return_type TEXT NOT NULL CHECK (return_type IN ('normal', 'gradual', 'reabilitacao', 'readaptacao')),
  gradual_hours INTEGER, -- horas diárias se gradual
  gradual_days INTEGER, -- dias de adaptação
  doctor_recommendations TEXT,
  restrictions TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  aso_id UUID REFERENCES occupational_asos(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planejado' CHECK (status IN ('planejado', 'em_andamento', 'concluido', 'cancelado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Restrictions (restrições ocupacionais)
CREATE TABLE IF NOT EXISTS occupational_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES occupational_employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  aso_id UUID REFERENCES occupational_asos(id) ON DELETE SET NULL,
  restriction_type TEXT NOT NULL CHECK (restriction_type IN ('permanente', 'temporaria')),
  restriction TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('aso', 'medico', 'ergonomico', 'legal', 'outros')),
  start_date DATE NOT NULL,
  end_date DATE,
  activities_prevented TEXT,
  recommendations TEXT,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada', 'vencida')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Alerts (alertas automáticos)
CREATE TABLE IF NOT EXISTS occupational_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  employee_id UUID REFERENCES occupational_employees(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('aso_vencendo', 'exame_atrasado', 'exame_agendado', 'exame_vencendo', 'retorno_previsto', 'pcmso_vencendo', 'afastamento_prolongado', 'restricao_vencendo')),
  title TEXT NOT NULL,
  description TEXT,
  reference_date DATE NOT NULL, -- data do evento que gerou o alerta
  days_offset INTEGER, -- dias antes/após a referência
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Reports (relatórios salvos)
CREATE TABLE IF NOT EXISTS occupational_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID,
  report_type TEXT NOT NULL CHECK (report_type IN ('dashboard', 'aso', 'exames', 'atestados', 'afastamentos', 'pcmso', 'indicadores', 'personalizado')),
  title TEXT NOT NULL,
  params JSONB, -- parâmetros usados na geração
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_occ_employees_company ON occupational_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_occ_employees_status ON occupational_employees(status);
CREATE INDEX IF NOT EXISTS idx_occ_asos_employee ON occupational_asos(employee_id);
CREATE INDEX IF NOT EXISTS idx_occ_asos_company ON occupational_asos(company_id);
CREATE INDEX IF NOT EXISTS idx_occ_asos_validity ON occupational_asos(validity_date);
CREATE INDEX IF NOT EXISTS idx_occ_exams_employee ON occupational_exams(employee_id);
CREATE INDEX IF NOT EXISTS idx_occ_exams_company ON occupational_exams(company_id);
CREATE INDEX IF NOT EXISTS idx_occ_exams_due ON occupational_exams(due_date);
CREATE INDEX IF NOT EXISTS idx_occ_exams_status ON occupational_exams(status);
CREATE INDEX IF NOT EXISTS idx_occ_certificates_employee ON occupational_medical_certificates(employee_id);
CREATE INDEX IF NOT EXISTS idx_occ_certificates_company ON occupational_medical_certificates(company_id);
CREATE INDEX IF NOT EXISTS idx_occ_absences_employee ON occupational_absences(employee_id);
CREATE INDEX IF NOT EXISTS idx_occ_absences_company ON occupational_absences(company_id);
CREATE INDEX IF NOT EXISTS idx_occ_absences_status ON occupational_absences(status);
CREATE INDEX IF NOT EXISTS idx_occ_return_employee ON occupational_return_to_work(employee_id);
CREATE INDEX IF NOT EXISTS idx_occ_return_status ON occupational_return_to_work(status);
CREATE INDEX IF NOT EXISTS idx_occ_restrictions_employee ON occupational_restrictions(employee_id);
CREATE INDEX IF NOT EXISTS idx_occ_alerts_company ON occupational_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_occ_alerts_resolved ON occupational_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_occ_alerts_type ON occupational_alerts(alert_type);
