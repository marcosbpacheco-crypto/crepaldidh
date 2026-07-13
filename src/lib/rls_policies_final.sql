-- =============================================
-- RLS Policies Finais — Todas as Tabelas
-- Remove FOR ALL generico e cria SELECT/INSERT/UPDATE/DELETE para cada tabela
-- =============================================
-- Executar no SQL Editor do Supabase apos a migration principal
-- =============================================

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
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
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Remove FOR ALL generico
    EXECUTE format('DROP POLICY IF EXISTS %I_all ON %I;', tbl, tbl);
    -- Cria policies individuais
    EXECUTE format('CREATE POLICY %I_select ON %I FOR SELECT TO authenticated USING (true);', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_insert ON %I FOR INSERT TO authenticated WITH CHECK (true);', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_update ON %I FOR UPDATE TO authenticated USING (true) WITH CHECK (true);', tbl, tbl);
    EXECUTE format('CREATE POLICY %I_delete ON %I FOR DELETE TO authenticated USING (true);', tbl, tbl);
  END LOOP;
END $$;

-- =============================================
-- Habilitar Realtime para tabelas principais
-- =============================================
-- IMPORTANTE: No Supabase Dashboard → Database → Replication,
-- marcar as seguintes tabelas como "Enable Realtime":
-- client_list, client_contacts, client_interactions, client_documents, client_feedbacks,
-- crm_companies, crm_contacts, crm_deals, crm_proposals, crm_contracts, crm_activities, crm_tasks,
-- training_events, training_participants, calendar_events,
-- documents, admin_users, projects, project_tasks
-- =============================================
