-- =============================================
-- Migration 002: Fix CHECK constraints to match frontend values
--
-- Problema: constraints criadas via supabaseMigration.sql tinham valores
-- desatualizados. Frontend enviava valores que violavam as constraints.
--
-- Fix: ALTER TABLE para DROP e ADD constraints com uniao dos valores
-- antigos (para nao quebrar dados existentes) + valores do frontend.
-- =============================================

-- 1. CALENDAR EVENTS - event_type
-- Antigos: meeting, training, deadline, reminder, appointment, other
-- Frontend: commercial_meeting, client_meeting, mentoring, lecture, sipat, nr01_interview, technical_visit, internal_activity
ALTER TABLE IF EXISTS public.calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;

ALTER TABLE IF EXISTS public.calendar_events
  ADD CONSTRAINT calendar_events_event_type_check
  CHECK (event_type IN (
    'meeting','training','deadline','reminder','appointment','other',
    'commercial_meeting','client_meeting','mentoring','lecture','sipat',
    'nr01_interview','technical_visit','internal_activity'
  ));

-- 2. CALENDAR EVENTS - status
-- Antigos: confirmed, tentative, cancelled
-- Frontend: scheduled, completed, canceled, rescheduled
ALTER TABLE IF EXISTS public.calendar_events
  DROP CONSTRAINT IF EXISTS calendar_events_status_check;

ALTER TABLE IF EXISTS public.calendar_events
  ADD CONSTRAINT calendar_events_status_check
  CHECK (status IN (
    'confirmed','tentative','cancelled',
    'scheduled','completed','canceled','rescheduled'
  ));

-- 3. DOCUMENTS - type
-- Antigos: contract, proposal, report, template, certificate, other
-- Frontend: diagnostic, inventory, action_plan, attendance_list, training_material, evidence, meeting_minutes, financial
ALTER TABLE IF EXISTS public.documents
  DROP CONSTRAINT IF EXISTS documents_type_check;

ALTER TABLE IF EXISTS public.documents
  ADD CONSTRAINT documents_type_check
  CHECK (type IN (
    'contract','proposal','report','template','certificate','other',
    'diagnostic','inventory','action_plan','attendance_list',
    'training_material','evidence','meeting_minutes','financial'
  ));
