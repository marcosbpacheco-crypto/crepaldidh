-- =============================================
-- Migration 007: Central de Conhecimento
--
-- Objetivo:
--   Transformar o módulo Documentos em uma central de conhecimento.
--   As abas Modelos/Templates, Materiais, Formulários, Avaliações,
--   Relatórios e Outros reutilizam a tabela `documents` existente
--   (campo `category`).
--   FERRAMENTAS e DINÂMICAS recebem tabelas próprias por exigirem
--   campos estruturados (objetivo, preparação, passo a passo, etc.).
--   Utilização de recursos = N:N via knowledge_usage (relacionamento
--   com serviços + histórico); vínculos de referência via knowledge_links;
--   favoritos por usuário via knowledge_favorites.
-- =============================================

-- 1. Ferramentas
CREATE TABLE IF NOT EXISTS public.knowledge_tools (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID NULL,
  name                      VARCHAR(255) NOT NULL,
  description               TEXT NULL,
  finalidade                TEXT NULL,
  categoria                 VARCHAR(60)  NOT NULL DEFAULT 'Personalizada',
  -- Diagnóstico | Mentoria | Assessoria Empresarial | RH | Liderança
  -- | Desenvolvimento | Treinamento | Cultura | Clima | Comunicação
  -- | Gestão | Personalizada
  tipo                      VARCHAR(80) NULL,
  servico_relacionado       VARCHAR(120) NULL,
  publico_alvo              TEXT NULL,
  duracao_estimada          VARCHAR(60) NULL,
  objetivo                  TEXT NULL,
  preparacao                TEXT NULL,
  passo_a_passo             TEXT NULL,
  orientacoes               TEXT NULL,
  cuidados                  TEXT NULL,
  resultado_esperado        TEXT NULL,
  materiais                 TEXT NULL,
  equipamentos              TEXT NULL,
  documentos_complementares TEXT NULL,
  status                    VARCHAR(20)  NOT NULL DEFAULT 'rascunho',
  -- rascunho | ativa | arquivada
  tags                      TEXT[] NULL DEFAULT ARRAY[]::TEXT[],
  services                  JSONB NULL DEFAULT '[]'::JSONB,
  -- lista de { name, tipo } de serviços onde a ferramenta é aplicada
  arquivo_principal_url     TEXT NULL,
  arquivos                  JSONB NULL DEFAULT '[]'::JSONB,
  -- lista de { name, type, size, fileUrl }
  historico                 JSONB NULL DEFAULT '[]'::JSONB,
  is_client_visible         BOOLEAN NOT NULL DEFAULT false,
  versao                    INT NOT NULL DEFAULT 1,
  origem_id                 UUID NULL,
  criado_por                VARCHAR(255) NULL,
  atualizado_por            VARCHAR(255) NULL,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_tools_categoria ON public.knowledge_tools (categoria);
CREATE INDEX IF NOT EXISTS idx_knowledge_tools_status    ON public.knowledge_tools (status);
CREATE INDEX IF NOT EXISTS idx_knowledge_tools_tenant    ON public.knowledge_tools (tenant_id);

-- 2. Dinâmicas
CREATE TABLE IF NOT EXISTS public.knowledge_dynamics (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NULL,
  name                    VARCHAR(255) NOT NULL,
  objetivo                TEXT NULL,
  publico                 TEXT NULL,
  num_participantes       VARCHAR(60) NULL,
  duracao                 VARCHAR(60) NULL,
  dificuldade             VARCHAR(40) NULL,
  -- facil | media | avancada
  contexto                VARCHAR(120) NULL,
  materiais               TEXT NULL,
  preparacao              TEXT NULL,
  passo_a_passo           TEXT NULL,
  perguntas_discussao     TEXT NULL,
  resultado_esperado      TEXT NULL,
  observacoes_facilitador TEXT NULL,
  categoria               VARCHAR(60)  NOT NULL DEFAULT 'Outro',
  -- Integração | Comunicação | Liderança | Trabalho em equipe | Confiança
  -- | Feedback | Conflitos | Criatividade | Cultura | Clima | Desenvolvimento | Outro
  tags                    TEXT[] NULL DEFAULT ARRAY[]::TEXT[],
  status                  VARCHAR(20)  NOT NULL DEFAULT 'rascunho',
  is_client_visible       BOOLEAN NOT NULL DEFAULT false,
  arquivos                JSONB NULL DEFAULT '[]'::JSONB,
  historico               JSONB NULL DEFAULT '[]'::JSONB,
  versao                  INT NOT NULL DEFAULT 1,
  origem_id               UUID NULL,
  criado_por              VARCHAR(255) NULL,
  atualizado_por          VARCHAR(255) NULL,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_dynamics_categoria ON public.knowledge_dynamics (categoria);
CREATE INDEX IF NOT EXISTS idx_knowledge_dynamics_status    ON public.knowledge_dynamics (status);
CREATE INDEX IF NOT EXISTS idx_knowledge_dynamics_tenant    ON public.knowledge_dynamics (tenant_id);

-- 3. Utilização (relacionamento N:N com serviços + histórico de uso)
CREATE TABLE IF NOT EXISTS public.knowledge_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NULL,
  resource_type VARCHAR(20)  NOT NULL,               -- tool | dynamic | document
  resource_id   UUID NOT NULL,
  target_type   VARCHAR(30)  NOT NULL,               -- client | company | project | assessoria | training | mentoring | custom
  target_id     UUID NULL,
  target_name   VARCHAR(255) NOT NULL,
  client_id     UUID NULL,
  company_id    UUID NULL,
  responsavel   VARCHAR(255) NULL,
  data          DATE NOT NULL DEFAULT CURRENT_DATE,
  observacao    TEXT NULL,
  resultado     TEXT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_usage_resourcetype ON public.knowledge_usage (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_usage_targettype   ON public.knowledge_usage (target_type, target_id);

-- 4. Vínculos N:N de referência (documento/materiais ↔ ferramenta/dinâmica/treinamento/...)
CREATE TABLE IF NOT EXISTS public.knowledge_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NULL,
  resource_type VARCHAR(20)  NOT NULL,               -- document | tool | dynamic
  resource_id   UUID NOT NULL,
  target_type   VARCHAR(30)  NOT NULL,               -- tool | dynamic | training | mentoring | project | service | document | material | client | company
  target_id     UUID NULL,
  target_name   VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_links_resourcetype ON public.knowledge_links (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_links_targettype   ON public.knowledge_links (target_type, target_id);

-- 5. Favoritos por usuário
CREATE TABLE IF NOT EXISTS public.knowledge_favorites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(255) NOT NULL,
  resource_type VARCHAR(20)  NOT NULL,               -- tool | dynamic | document
  resource_id   UUID NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_knowledge_favorites_type ON public.knowledge_favorites (resource_type, resource_id);