-- ==========================================
-- AI Copilot - CrepaldiDH ERP
-- ==========================================

-- 1. AI_CONVERSATIONS
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  assistant_type TEXT NOT NULL DEFAULT 'chat',
  module TEXT,
  company_id TEXT,
  project_id TEXT,
  favorite BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AI_MESSAGES
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AI_PROMPTS (Biblioteca de prompts)
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  prompt TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  tags TEXT[] DEFAULT '{}',
  is_template BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. AI_TEMPLATES (Modelos de resposta)
CREATE TABLE IF NOT EXISTS ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  assistant_type TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AI_USAGE_LOGS
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assistant_type TEXT NOT NULL,
  action TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. AI_PERMISSIONS
CREATE TABLE IF NOT EXISTS ai_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  can_access_crm BOOLEAN DEFAULT true,
  can_access_financial BOOLEAN DEFAULT false,
  can_access_nr01 BOOLEAN DEFAULT true,
  can_access_trainings BOOLEAN DEFAULT true,
  can_access_mentoring BOOLEAN DEFAULT true,
  can_access_documents BOOLEAN DEFAULT true,
  can_generate_reports BOOLEAN DEFAULT true,
  can_export BOOLEAN DEFAULT true,
  max_tokens_per_day INTEGER DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON ai_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_prompts_category ON ai_prompts(category);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user ON ai_usage_logs(user_id, created_at DESC);

-- RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own conversations" ON ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own messages" ON ai_messages FOR ALL USING (conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users manage own prompts" ON ai_prompts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own logs" ON ai_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users see own permissions" ON ai_permissions FOR SELECT USING (auth.uid() = user_id);

-- Seed templates
INSERT INTO ai_templates (name, assistant_type, prompt_template, variables, category) VALUES
('Relatório NR01', 'nr01', 'Com base nos dados de NR01 da empresa {company}, gere um relatório contendo: resumo das entrevistas, classificação dos riscos por nível, planos de ação sugeridos, recomendações técnicas e prazo sugerido para implementação.', ARRAY['company'], 'relatorios'),
('Relatório de Treinamento', 'training', 'Com base nos dados do treinamento {event_name}, gere um relatório completo contendo: participantes presentes, NPS médio, feedbacks recebidos, recomendações para próximas edições.', ARRAY['event_name'], 'relatorios'),
('Relatório de Mentoria', 'mentoring', 'Com base na sessão de mentoria do participante {participant}, gere um resumo contendo: tópicos trabalhados, insights identificados, plano de ação definido e próximos passos.', ARRAY['participant'], 'relatorios'),
('Resumo Executivo', 'executive', 'Gere um resumo executivo da CrepaldiDH com base nos seguintes dados: {kpis}. Destaque pontos fortes, pontos de atenção e recomendações estratégicas.', ARRAY['kpis'], 'relatorios'),
('Proposta Comercial', 'commercial', 'Crie uma proposta comercial para {company} para o serviço de {service}. Inclua: diagnóstico da situação atual, proposta de valor, escopo do trabalho, investimento e condições comerciais.', ARRAY['company', 'service'], 'comercial'),
('E-mail de Follow-up', 'commercial', 'Escreva um e-mail de follow-up para {contact} da empresa {company} após a reunião do dia {date}. Tom profissional e consultivo.', ARRAY['contact', 'company', 'date'], 'comercial'),
('Análise Financeira', 'financial', 'Com base nos dados financeiros: receita {revenue}, despesas {expenses}, margem {margin}, inadimplência {overdue}. Gere uma análise de saúde financeira com recomendações.', ARRAY['revenue', 'expenses', 'margin', 'overdue'], 'financeiro'),
('Plano de Ação NR01', 'nr01', 'Sugira um plano de ação para mitigar os riscos identificados: {risks}. Considere prazos, responsáveis e indicadores de sucesso.', ARRAY['risks'], 'nr01');
