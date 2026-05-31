-- ========================================================
-- Schema SQL para o Módulo de Treinamentos, Palestras e SIPAT
-- CrepaldiDH ERP
-- ========================================================

-- 1. Tabela de Programas de SIPAT
CREATE TABLE IF NOT EXISTS sipat_programs (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL, -- Referência à empresa/cliente ativo no CRM
    title VARCHAR(255) NOT NULL,
    theme VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'planejado' CHECK (status IN ('planejado', 'agendado', 'em_andamento', 'concluido', 'cancelado')),
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Eventos de Treinamentos e Palestras
CREATE TABLE IF NOT EXISTS training_events (
    id VARCHAR(255) PRIMARY KEY,
    company_id VARCHAR(255) NOT NULL, -- Referência à empresa/cliente ativo no CRM
    project_id VARCHAR(255), -- Referência ao projeto vinculado no módulo de projetos
    sipat_program_id VARCHAR(255) REFERENCES sipat_programs(id) ON DELETE SET NULL, -- Se vinculado a uma SIPAT
    type VARCHAR(50) NOT NULL CHECK (type IN ('Palestra', 'Treinamento', 'Workshop', 'SIPAT', 'Capacitação', 'Imersão', 'Mentoria coletiva')),
    name VARCHAR(255) NOT NULL,
    theme VARCHAR(255) NOT NULL,
    objective TEXT,
    target_audience VARCHAR(255),
    facilitator VARCHAR(255) NOT NULL,
    modality VARCHAR(50) NOT NULL CHECK (modality IN ('presencial', 'online', 'hibrido')),
    location VARCHAR(255), -- Endereço físico ou link do Zoom/Teams
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    hours_duration DECIMAL(5,2) NOT NULL, -- Carga horária
    expected_participants INTEGER DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0.00, -- Custo/receita do evento
    status VARCHAR(50) DEFAULT 'planejado' CHECK (status IN ('planejado', 'agendado', 'em_divulgacao', 'realizado', 'cancelado', 'reagendado', 'concluido')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Cronograma Diário da SIPAT (Se for usada para palestras dentro da SIPAT)
CREATE TABLE IF NOT EXISTS sipat_schedule (
    id VARCHAR(255) PRIMARY KEY,
    sipat_program_id VARCHAR(255) NOT NULL REFERENCES sipat_programs(id) ON DELETE CASCADE,
    training_event_id VARCHAR(255) REFERENCES training_events(id) ON DELETE SET NULL,
    day_number INTEGER NOT NULL, -- Dia 1, Dia 2, etc.
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    theme VARCHAR(255) NOT NULL,
    facilitator VARCHAR(255) NOT NULL,
    location VARCHAR(255)
);

-- 4. Tabela de Participantes dos Eventos
CREATE TABLE IF NOT EXISTS training_participants (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
    crm_contact_id VARCHAR(255), -- Se vinculado a um colaborador cadastrado na Gestão de Pessoas (CRM)
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    unit VARCHAR(100),
    sector VARCHAR(100),
    role VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Controle de Presença e Assinatura Digital
CREATE TABLE IF NOT EXISTS training_attendance (
    id VARCHAR(255) PRIMARY KEY,
    participant_id VARCHAR(255) NOT NULL REFERENCES training_participants(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
    attendance_status VARCHAR(50) DEFAULT 'ausente' CHECK (attendance_status IN ('presente', 'ausente', 'justificado')),
    entry_time TIMESTAMP WITH TIME ZONE,
    signature_simple VARCHAR(255), -- Assinatura digital simples em texto ou token
    justification TEXT, -- Justificativa em caso de ausência
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Certificados Emitidos
CREATE TABLE IF NOT EXISTS training_certificates (
    id VARCHAR(255) PRIMARY KEY,
    participant_id VARCHAR(255) NOT NULL REFERENCES training_participants(id) ON DELETE CASCADE,
    event_id VARCHAR(255) NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
    validation_code VARCHAR(100) UNIQUE NOT NULL, -- Código único de validação
    pdf_url VARCHAR(255),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de Avaliação de Reação & NPS
CREATE TABLE IF NOT EXISTS training_feedbacks (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
    participant_id VARCHAR(255) REFERENCES training_participants(id) ON DELETE SET NULL,
    rating_general INTEGER NOT NULL CHECK (rating_general BETWEEN 1 AND 5),
    clarity_content INTEGER NOT NULL CHECK (clarity_content BETWEEN 1 AND 5),
    applicability INTEGER NOT NULL CHECK (applicability BETWEEN 1 AND 5),
    didactics INTEGER NOT NULL CHECK (didactics BETWEEN 1 AND 5),
    organization INTEGER NOT NULL CHECK (organization BETWEEN 1 AND 5),
    nps INTEGER NOT NULL CHECK (nps BETWEEN 0 AND 10),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela de Materiais de Apoio
CREATE TABLE IF NOT EXISTS training_materials (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('slide', 'apostila', 'pdf', 'foto', 'video', 'link', 'dinamica', 'checklist', 'evidencia')),
    file_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabela de Relatórios Pós-Evento
CREATE TABLE IF NOT EXISTS training_reports (
    id VARCHAR(255) PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL REFERENCES training_events(id) ON DELETE CASCADE,
    pdf_url VARCHAR(255),
    recommendations TEXT,
    executive_summary TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES DE PERFORMANCE E INTEGRIDADE
CREATE INDEX IF NOT EXISTS idx_training_events_company ON training_events(company_id);
CREATE INDEX IF NOT EXISTS idx_training_events_date ON training_events(event_date);
CREATE INDEX IF NOT EXISTS idx_training_participants_event ON training_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_event ON training_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_training_feedbacks_event ON training_feedbacks(event_id);

-- DIRETRIZES DE SEGURANÇA (RLS - Row Level Security)
ALTER TABLE sipat_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_reports ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS simplificadas de leitura e escrita (todas operações liberadas para usuários autenticados)
CREATE POLICY all_sipat_programs ON sipat_programs FOR ALL USING (true);
CREATE POLICY all_training_events ON training_events FOR ALL USING (true);
CREATE POLICY all_training_participants ON training_participants FOR ALL USING (true);
CREATE POLICY all_training_attendance ON training_attendance FOR ALL USING (true);
CREATE POLICY all_training_certificates ON training_certificates FOR ALL USING (true);
CREATE POLICY all_training_feedbacks ON training_feedbacks FOR ALL USING (true);
CREATE POLICY all_training_materials ON training_materials FOR ALL USING (true);
CREATE POLICY all_training_reports ON training_reports FOR ALL USING (true);
