-- CrepaldiDH ERP - Calendar Module Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Calendar Events (Compromissos)
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'commercial_meeting', 'client_meeting', 'mentoring', 'training',
    'lecture', 'sipat', 'nr01_interview', 'technical_visit', 'internal_activity'
  )),
  description TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  company_name TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name TEXT,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  contract_name TEXT,
  responsible TEXT NOT NULL DEFAULT 'Equipe CrepaldiDH',
  location TEXT,
  link TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  all_day BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'canceled', 'rescheduled')),
  color TEXT DEFAULT '#8b5cf6',
  notes TEXT,
  reminder_minutes INTEGER DEFAULT 30,
  google_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Calendar Participants (Participantes)
CREATE TABLE IF NOT EXISTS calendar_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Calendar Reminders (Lembretes)
CREATE TABLE IF NOT EXISTS calendar_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  reminder_time TIMESTAMPTZ NOT NULL,
  method TEXT NOT NULL DEFAULT 'notification' CHECK (method IN ('notification', 'email', 'whatsapp')),
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_company ON calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
CREATE INDEX IF NOT EXISTS idx_calendar_participants_event ON calendar_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_event ON calendar_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_reminders_time ON calendar_reminders(reminder_time);

-- RLS Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on calendar_participants" ON calendar_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on calendar_reminders" ON calendar_reminders FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_calendar_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calendar_events_modtime
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_calendar_modified_column();
