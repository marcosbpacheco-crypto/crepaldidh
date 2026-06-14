-- =============================================
-- RLS Policies for CrepaldiDH ERP on Supabase
-- Execute this in Supabase SQL Editor AFTER
-- creating the tables from schema files.
-- =============================================

-- 1. Calendar Module
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_reminders ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see all events (multi-tenant ready)
CREATE POLICY "calendar_events_select" ON calendar_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendar_events_insert" ON calendar_events
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "calendar_events_update" ON calendar_events
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "calendar_events_delete" ON calendar_events
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "calendar_participants_select" ON calendar_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendar_participants_insert" ON calendar_participants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "calendar_reminders_select" ON calendar_reminders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "calendar_reminders_insert" ON calendar_reminders
  FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Training Module
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_events_select" ON training_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "training_events_insert" ON training_events
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "training_events_update" ON training_events
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "training_events_delete" ON training_events
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "training_participants_select" ON training_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "training_participants_insert" ON training_participants
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "training_participants_update" ON training_participants
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "training_participants_delete" ON training_participants
  FOR DELETE TO authenticated USING (true);

-- 3. Financial Module
ALTER TABLE financial_receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_recurring ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_select" ON financial_receivables
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "financial_insert" ON financial_receivables
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "financial_update" ON financial_receivables
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "financial_delete" ON financial_receivables
  FOR DELETE TO authenticated USING (true);

-- Repeat similar policies for payables, movements, recurring, invoices
CREATE POLICY "financial_payables_select" ON financial_payables
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "financial_payables_insert" ON financial_payables
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "financial_movements_select" ON financial_movements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "financial_movements_insert" ON financial_movements
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "financial_recurring_select" ON financial_recurring
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "financial_recurring_insert" ON financial_recurring
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "financial_invoices_select" ON financial_invoices
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "financial_invoices_insert" ON financial_invoices
  FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Occupational Health Module
ALTER TABLE occupational_clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_exam_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_pcmso ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_asos ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_medical_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_return_to_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupational_reports ENABLE ROW LEVEL SECURITY;

-- Generic policies for all occupational tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'occupational_clinics', 'occupational_doctors', 'occupational_exam_types',
    'occupational_pcmso', 'occupational_employees', 'occupational_asos',
    'occupational_exams', 'occupational_medical_certificates', 'occupational_absences',
    'occupational_return_to_work', 'occupational_restrictions', 'occupational_alerts',
    'occupational_reports'
  ])
  LOOP
    EXECUTE format('CREATE POLICY %I_select ON %I FOR SELECT TO authenticated USING (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_insert ON %I FOR INSERT TO authenticated WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_update ON %I FOR UPDATE TO authenticated USING (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_delete ON %I FOR DELETE TO authenticated USING (true)', tbl, tbl);
  END LOOP;
END $$;

-- 5. Mentoring Module
ALTER TABLE mentoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_pdi ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_pdi_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentoring_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mentoring_select" ON mentoring_sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "mentoring_insert" ON mentoring_sessions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "mentoring_update" ON mentoring_sessions
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "mentoring_delete" ON mentoring_sessions
  FOR DELETE TO authenticated USING (true);

-- Similar policies for participants, pdi, goals, assessments
CREATE POLICY "mentoring_participants_select" ON mentoring_participants
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "mentoring_participants_insert" ON mentoring_participants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "mentoring_pdi_select" ON mentoring_pdi
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "mentoring_pdi_insert" ON mentoring_pdi
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "mentoring_goals_select" ON mentoring_pdi_goals
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "mentoring_goals_insert" ON mentoring_pdi_goals
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "mentoring_assessments_select" ON mentoring_assessments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "mentoring_assessments_insert" ON mentoring_assessments
  FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- FUTURE: Tenant Isolation
-- When multi-tenant is needed, replace all
-- USING (true) with:
--   USING (tenant_id = current_setting('app.current_tenant_id', true))
-- And add tenant_id column to all tables.
-- =============================================
