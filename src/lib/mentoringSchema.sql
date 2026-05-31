-- Supabase schema for Mentoring, PDI & Human Development modules
-- Run with: supabase db push or execute in Supabase SQL Editor

-- 1. Competencies library
CREATE TABLE IF NOT EXISTS competencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  category varchar(100),
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Development Tools library
CREATE TABLE IF NOT EXISTS development_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  category varchar(100),
  description text,
  created_at timestamptz DEFAULT now()
);

-- 3. Mentoring Participants
CREATE TABLE IF NOT EXISTS mentoring_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
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

-- 4. Mentoring Sessions
CREATE TABLE IF NOT EXISTS mentoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type varchar(50) NOT NULL, -- 'individual', 'coletiva', 'lideranca', 'executiva'
  title varchar(255) NOT NULL,
  date timestamptz NOT NULL,
  duration integer NOT NULL, -- in minutes
  objective text,
  topics text,
  action_plan text,
  next_steps text,
  insights text,
  challenges text,
  potentials text,
  status varchar(50) DEFAULT 'agendada', -- 'agendada', 'realizada', 'cancelada'
  created_at timestamptz DEFAULT now()
);

-- Join table for session participants
CREATE TABLE IF NOT EXISTS session_participants (
  session_id uuid REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, participant_id)
);

-- Session tools utilization history
CREATE TABLE IF NOT EXISTS tool_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid REFERENCES development_tools(id) ON DELETE CASCADE,
  session_id uuid REFERENCES mentoring_sessions(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  result text,
  date timestamptz DEFAULT now()
);

-- 5. PDI Plans
CREATE TABLE IF NOT EXISTS pdi_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  period varchar(100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. PDI Goals/Actions
CREATE TABLE IF NOT EXISTS pdi_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pdi_id uuid REFERENCES pdi_plans(id) ON DELETE CASCADE,
  competency varchar(255) NOT NULL,
  objective text NOT NULL,
  action text NOT NULL,
  responsible varchar(255) NOT NULL,
  deadline date NOT NULL,
  indicator text,
  status varchar(50) DEFAULT 'nao_iniciado', -- 'nao_iniciado', 'em_andamento', 'concluido', 'atrasado'
  created_at timestamptz DEFAULT now()
);

-- 7. Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL, -- 'autoavaliacao', 'lider', '180', '360'
  evaluator_id uuid, -- Reference to user/evaluator if applicable
  date date NOT NULL,
  observations text,
  created_at timestamptz DEFAULT now()
);

-- 8. Assessment Results (Scores per competency)
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  competency_id uuid REFERENCES competencies(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now()
);

-- 9. Mentoring Reports
CREATE TABLE IF NOT EXISTS mentoring_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid REFERENCES mentoring_participants(id) ON DELETE CASCADE,
  type varchar(50) NOT NULL, -- 'individual', 'lideranca', 'evolucao', 'executivo'
  title varchar(255) NOT NULL,
  pdf_url varchar(1024),
  generated_at timestamptz DEFAULT now()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_date ON mentoring_sessions(date);
CREATE INDEX IF NOT EXISTS idx_pdi_plans_participant ON pdi_plans(participant_id);
CREATE INDEX IF NOT EXISTS idx_pdi_goals_pdi ON pdi_goals(pdi_id);
CREATE INDEX IF NOT EXISTS idx_assessments_participant ON assessments(participant_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_reports_participant ON mentoring_reports(participant_id);
