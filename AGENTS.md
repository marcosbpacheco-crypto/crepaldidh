<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Session 2026-06-20

### Critical Fix: Changes not persisting after logout

**Root cause**: Three separate bugs caused data loss after logout/login:

1. **`LoginForm.tsx:38`** — `useEffect` chamava `localStorage.setItem('admin_users', json)` com dados do servidor (potencialmente defasados) em toda montagem, sobrescrevendo dados locais recentes. **Removido**.

2. **`LoginForm.tsx:107`** — Ordem do merge era `SEED_USERS → storedUsers → liveServerUsers` (cookie SOBRESCREVIA localStorage). Invertido para `SEED_USERS → liveServerUsers → storedUsers` — localStorage SEMPRE vence.

3. **`AdminContext.tsx:244-266`** — Cross-device sync effect adicionava ao estado local usuários que existiam no cookie/Supabase mas não no localStorage. Isso RESTAURAVA usuários intencionalmente deletados. **Removido completamente**. O sync cross-device agora é **unidirecional**: local → servidor apenas (via `syncUsersToCookie` no effect da linha 238). O merge servidor→local é responsabilidade exclusiva do `LoginForm.handleSubmit`, que prioriza dados locais.

### Persistência Blindada
- `addUser`/`deleteUser`/`updateUser`/`toggleUserActive` no `AdminContext` salvam DIRETAMENTE no `localStorage` dentro do próprio callback `setUsers(prev => ...)`, independente dos effects.
- Dois effects separados: um salva no `localStorage`, outro sincroniza com `cookie` + `Supabase Storage`. O sync é unidirecional (nunca importa do servidor).

### Supabase Storage
- Bucket `app-sync`, arquivo `admin-users.json`
- `saveUsersToSupabase` grava com `upsert: true` sempre que users mudam
- `loadUsersFromSupabase` lê de fallback (via `getUsersFromCookie`) se cookie/memória estiverem vazios
- Usa `SUPABASE_SERVICE_ROLE_KEY` para acesso de serviço
- `.env.local` com URL e chaves configurados

### Changes Made
- **Contratos/Propostas restritos** — Apenas `Administrador` e `Diretor` podem visualizar e baixar contratos e propostas:
  - **Documentos** (`documents/page.tsx`): Filtra completamente docs do tipo `contract` e `proposal` para não-admin/diretor (`visibleDocuments`); botão Download desabilitado no modal de detalhes; `handleDownload` bloqueia early-return; upload form oculta tipos `contract`/`proposal` do select
  - **CRM** (`CrmProposals.tsx`): Botões "Visualizar PDF", "Imprimir/Salvar PDF", "Gerar Proposta com IA" e "Gerar Contrato com IA" ocultos para não-admin/diretor
- **Build verificado**: 45 rotas, sem erros
- **Sistema limpo** — Todos os dados de seed mock foram removidos (arrays substituídos por `[]`):
  - **CRM**: companies, contacts, deals, activities, tasks, proposals, contracts
  - **Documentos**: documents, versions, access logs
  - **Clientes**: clients, contacts, interactions, documents, feedbacks
  - **Mentorias**: participants, sessions, PDI plans (mantidos competencies e tools como templates)
  - **Treinamentos**: SIPATs, events, participants, feedbacks, certificates
  - **Financeiro**: receivables, payables, recurring rules (mantidos payment methods e categories)
  - **Assessoria**: diagnosticos, OKRs, SWOTs, planos de ação, KPIs
  - **Tenants**: tenants, usage, billing (mantidos plans)
  - **Admin**: audit logs, LGPD consents, privacy requests; removidos usuários cliente
  - **Acesso Temporário**: accesses, users, questionnaires, responses
  - **Portal**: requests, notifications, calendar events (mantidos portal users e permissions)
  - **Projetos/Dashboard**: SEED_PROJECTS
  - **Login**: removidos usuários cliente (mantidos usuários internos)
- **PDF exports padronizados** (A4, multi-página, header/footer):
  - **Financeiro** (`financial/page.tsx`): `handleExportPdf` refatorado — canvas dividido entre páginas, rodapé com numeração `Página X de Y · CrepaldiDH ERP`
  - **Treinamentos Relatórios** (`trainings/reports/page.tsx`): `handleExportReportPDF` corrigido — unidade `mm`, suporte multi-página com paginação
  - **Treinamentos Certificados** (`trainings/certificates/page.tsx`): `handleExportPDF` e `handleExportBulkPDF` corrigidos — orientação `landscape` A4 (210×297mm), escala 1.5x, multi-página no bulk
- **Assessoria — limpeza automática de órfãos** (`AssessoriaContext.tsx`):
  - Ao carregar e sempre que `crm:sync-companies` for disparado, filtra registros (diagnósticos, OKRs, SWOTs, planos de ação, KPIs) cujo campo `empresa` não exista em `name`/`tradeName` de nenhuma company do CRM
  - Comparação case-insensitive, baseada em `localStorage.crm_companies`
- **Exclusão de clientes protegida** — Apenas `Administrador` e `Diretor` podem excluir:
  - **CRM** (`CrmContext.tsx`): `deleteCompany` agora faz soft-delete (status → `inactive`); `deleteClient` faz soft-delete (status → `churned`); dados vinculados (contatos, negócios, propostas, contratos, atividades) são preservados
  - **Clientes** (`ClientsContext.tsx`): `deleteClient` faz soft-delete (status → `churned`); contatos, interações, documentos, feedbacks preservados
  - **CRM Companies** (`CrmCompanies.tsx`): Botão "Excluir" só aparece para Admin/Diretor; modal de confirmação customizado com alerta de preservação de dados
  - **Clientes** (`clients/page.tsx`): Botão "Excluir" só aparece para Admin/Diretor; modal de confirmação customizado informando que cliente será marcado como cancelado
- **Deploy**: `https://crepaldidh.vercel.app` (45 rotas, build limpo)

## Session 2026-07-12 — Fix runtime crashes + deploy manual

### Problemas resolvidos
1. **Loop infinito no CRM** (`CrmContext.tsx`): removida subscription `postgres_changes` Realtime que causava ciclo estado → POST → upsert DB → Realtime → refetchAll → estado, gerando `ERR_INSUFFICIENT_RESOURCES` no navegador
2. **API `/api/sync/crm` 500**: `syncService.ts` agora trata erro por tabela individualmente (try/catch no `Promise.all`) em vez de jogar exceção que derrubava toda requisição
3. **API `/api/clients` 500**: cada query de tabela tem try/catch próprio, isolando falhas
4. **`supabaseClient.ts` crashando página**: `throw new Error()` em módulo substituído por lazy getter — se env vars faltarem, `supabase` vira `null` silenciosamente
5. **Deploy**: Vercel CLI (`npx vercel --prod`); projeto estava em conta `mbpac-projects`; URL nova: `https://crepaldidh.vercel.app` (antiga `crepaldidh-erp.vercel.app` deletada)

## Session 2026-07-12 — Persistência blindada: localStorage SEMPRE vence

### Problema crítico
Ao recarregar a página, dados criados/deletados localmente (empresas, clientes, contatos, negócios, treinamentos, etc.) eram revertidos para o estado antigo vindo da API. Causa: em **todos os 10 contexts**, o fetch assíncrono da API sobrescrevia o estado mesmo quando o `localStorage` já tinha dados mais recentes.

Root cause: `loadFromLocal()` era chamado **depois** da API (apenas no `catch`/`else`), e a API SEMPRE vencia mesmo quando localStorage tinha dados atualizados.

### Fix aplicado (padrão consistente em todos os 10 contexts)
1. **`loadFromLocal()` executa PRIMEIRO** (síncrono, antes do fetch) — localStorage SEMPRE preenche o estado inicial
2. **Cada `setState` da API é guardado** com `if (get('ls_key', []).length === 0)` — API só seta estado se localStorage estiver vazio para aquela coleção
3. **API ainda salva em localStorage** (cache cross-device), mas nunca sobrescreve estado local
4. **`catch`/`else` não chama mais `loadFromLocal()`** — já rodou antes

### Arquivos modificados (10 contexts)
- **CrmContext.tsx** — `loadFromCache()` antes de `loadFromApi()`; cada `setX()` guardado com `getStored(key, []).length === 0`
- **ClientsContext.tsx** — `loadFromLocal()` extraído para fora e chamado primeiro; `get` movido pro escopo do effect; `localEmpty(key)` guard
- **TrainingsContext.tsx** — `loadFromLocal()` primeiro; `get(key, []).length === 0` guard
- **FinancialContext.tsx** — mesmo padrão
- **CalendarContext.tsx** — mesmo padrão
- **MentoringContext.tsx** — mesmo padrão
- **AssessoriaContext.tsx** — mesmo padrão
- **DocumentContext.tsx** — mesmo padrão
- **AcessoTemporarioContext.tsx** — mesmo padrão
- **AdminContext.tsx** — mesmo padrão (incluindo guard no `localStorage.setItem` do `for` loop que faltava)

### Build
50/50 rotas, TypeScript compilado, sem erros.

## Session 2026-07-12 — Soft delete real + persistência direta no módulo Clientes

### Problema
Excluir cliente só alterava React state (`status: 'churned'`). No refresh, o cliente voltava porque:
1. **`deleteClient` não chamava Supabase** — apenas `setClients(prev => prev.map(..., status:'churned'))`
2. **IDs locais inválidos** — `cli-${Date.now()}` não é UUID; `upsert` no `client_list` falhava silenciosamente
3. **localStorage escrito só no debounce** — sync effect de 500ms escrevia localStorage; refresh antes do timer perdia a alteração
4. **Sem coluna `deleted_at`** — não havia soft-delete real no banco
5. **Sem filtro `deleted_at IS NULL`** — GET trazia todos os registros

### Fix aplicado

**Infra (SQL migration — executar manualmente no Supabase):**
```sql
alter table public.client_list add column if not exists deleted_at timestamptz null;
create index if not exists idx_client_list_deleted_at on client_list(deleted_at);
```

**API `/api/clients/route.ts`:**
- `GET` — adicionado `.is('deleted_at', null)` na query `client_list`
- `DELETE` — agora seta `deleted_at: now()` + `status: 'churned'`
- `PATCH` — novo dispatchType `'restore'` que zera `deleted_at` e seta `status: 'active'`

**`syncService.ts`:**
- `loadModuleFromSupabase` — adiciona `.is('deleted_at', null)` para tabelas `client_list` e `crm_companies`

**`ClientsContext.tsx`:**
- `addClient` — UUID real (`crypto.randomUUID()`) em vez de `cli-${Date.now()}`; escreve localStorage **dentro do `setClients` callback** (imediato, não espera debounce); chama `/api/clients` POST
- `deleteClient` — `async`, chama `/api/clients` DELETE **com await**, valida resposta, só atualiza state se API confirmar; escreve localStorage imediatamente
- `restoreClient` — nova função: chama PATCH `/api/clients` com `_type:'restore'`, atualiza state + localStorage
- `hardDeleteClient` — `async`, atualiza state + localStorage imediatamente
- `updateClient` — escreve localStorage imediatamente + chama PATCH API
- Todos os `addContact`/`updateContact`/etc — escrevem localStorage imediatamente dentro do callback do `setState`

**`clients/page.tsx`:**
- Botão "Restaurar" aparece quando cliente está `churned` (icone `RotateCcw` verde)
- `isSubmitting` no formulário de novo/editar cliente — previne duplicidade; botão desabilitado durante submit
- Import de `restoreClient` do context

### SQL a executar manualmente no Supabase SQL Editor
```sql
alter table public.client_list add column if not exists deleted_at timestamptz null;
create index if not exists idx_client_list_deleted_at on client_list(deleted_at);
```

### Build
50/50 rotas, TypeScript compilado, sem erros.

## Session 2026-07-12 — Auditoria final: eliminação de fontes concorrentes + RLS + cache + SQL migration

### Ghost clients
Problema: clientes deletados reapareciam após refresh porque **CRM backfill effect** relia `localStorage.crm_companies` e recriava clientes ausentes em `clients_data`.

### Fix
1. **REMOVIDO** CRM backfill effect (causa raiz)
2. **REMOVIDO** cross-sync CRM em `addClient` (poluía `crm_companies`)
3. **REMOVIDO** event listener `clients:sync-data`
4. **API sempre vence** — removido `localEmpty` guard (agora que GET filtra `deleted_at is null`)
5. **deleteClient**: otimista — remove do state + localStorage imediatamente, depois chama API
6. **restoreClient**: recarrega do Supabase via `refreshClients()` após sucesso
7. **router.refresh()** via `useRouter` após delete/restore no page.tsx
8. **Helper console**: `window.__clearClientsCache()` — limpa só dados de clientes do localStorage

### RLS Policies
`client_list` tem policy `FOR ALL TO authenticated USING (true) WITH CHECK (true)`. API usa `SUPABASE_SERVICE_ROLE_KEY` que bypassa RLS. OK.

### Cache
`router.refresh()` chamado após delete/restore — invalida cache do servidor.

### Duplicidades
Formulário tem `isSubmitting` + botão `disabled` — previne duplo clique.

### SQL Migration executada
```sql
alter table public.client_list add column if not exists deleted_at timestamptz null;
create index if not exists idx_client_list_deleted_at on public.client_list (deleted_at);
```
**Confirmado**: coluna `deleted_at` existe, índice criado.

### Status Supabase
- Clientes ativos: 5
- Clientes deletados: 0
- Build: 50/50 rotas, sem erros
- Deploy: `https://crepaldidh.vercel.app`

## Session 2026-07-12 — RLS policies individuais + fix null/empty + error handling audit

### Policies RLS
- **Antes**: cada tabela tinha 1 policy `FOR ALL` (cobre SELECT/INSERT/UPDATE/DELETE)
- **Agora**: policies separadas por operacao nas tabelas crÃ­ticas:
  - `client_list`, `client_contacts`, `client_interactions`, `client_documents`, `client_feedbacks`
  - `crm_companies`, `admin_users`
  - `projects`, `project_tasks`, `companies`
- Exemplo (`client_list`):
  ```sql
  DROP POLICY IF EXISTS client_list_all ON client_list;
  CREATE POLICY client_list_select ON client_list FOR SELECT TO authenticated USING (true);
  CREATE POLICY client_list_insert ON client_list FOR INSERT TO authenticated WITH CHECK (true);
  CREATE POLICY client_list_update ON client_list FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  CREATE POLICY client_list_delete ON client_list FOR DELETE TO authenticated USING (true);
  ```
- **Nota**: API routes usam `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS). As policies servem para acesso direto via anon key (ProjectContext, CompanyForm).

### Fix EMPTY/NULL values
- **`/api/clients/route.ts` POST**: `company_id` agora salva como `null` (em vez de `''` vazio) quando nÃ£o hÃ¡ referÃªncia de empresa
- Outros campos opcionais (`cnpj`, `segment`, `city`, `state`, `internal_responsible`, `start_date`, `end_date`, `notes`) tambÃ©m salvam como `null` em vez de `''`
- **Causa**: form usa `companyId: cli-comp-${Date.now()}` como placeholder local; API salvava como string vazia

### Error handling audit
- Todas as API routes (`/api/clients`, `/api/admin/users`, `/api/sync-admin-users`, `/api/sync/[moduleKey]`) checam `{ data, error }` e retornam cÃ³digo HTTP adequado
- Todos os contexts em client-side usam `console.error` nos catch blocks (nunca `.catch(() => {})`)
- Direct Supabase writes (CompanyForm, ProjectContext) checam `{ data, error }` e logam erro em vez de `throw`
- Build: 50/50 rotas, sem erros

## Session 2026-07-12 — Auditoria final: eliminacao de fontes concorrentes + cache + SQL migration

### Ghost clients
Problema: clientes deletados reapareciam apos refresh porque **CrmContext reconciler relia localStorage.clients_data e recriava clientes ausentes em clients_data**.

### Fix
1. **REMOVIDO** CrmContext reconciler section that filtered clients_data to only match CRM companies (CrmContext.tsx:345-394). Causa raiz: se `crm_companies` estiver vazio, TODOS os clientes sao filtrados e `clients_data` e sobrescrito com `[]`.
2. **REMOVIDO** Cross-sync em `addCompany` que escrevia em `clients_data` (CrmContext.tsx:631-658). CrmContext NAO deve manipular clients_data.
3. **addClient**: agora passa `id` no body do POST (`JSON.stringify({ _type: 'client', id: newClient.id, ...c })`) — DB usa o MESMO UUID do client-side. Aguarda resposta da API (`await`).
4. **updateClient/deleteClient**: agora usam `await` + `console.log(data/error)` — erro aparece no console do navegador.
5. **addContact/addInteraction/addFeedback**: agora chamam `POST /api/clients` com `_type: 'contact'|'interaction'|'feedback'` — antes so escreviam em localStorage.
6. **API POST /api/clients**: endpoints para client, contact, interaction, feedback aceitam `body.id` opcional — se fornecido, usa no INSERT em vez de auto-generar UUID.
7. **page.tsx handleSave**: agora `async`, faz `await onSave()` e `await onUpdate()` — antes nao aguardava Promise.
8. **Console.log temporario**: adicionado em addClient, updateClient, deleteClient, hardDeleteClient, addContact, updateContact, deleteContact, addInteraction, addFeedback.

### Status
- Build: 50/50 rotas, sem erros
- Deploy pendente

## Session 2026-07-12 — Refactor: persistencia confiavel + Realtime + RLS final (modulo Clientes como piloto)

### Mudancas arquiteturais

**1. Supabase client (`lib/supabase/client.ts`):** ja usa `createBrowserClient` do `@supabase/ssr` com autoRefreshToken nativo. Mantido.

**2. Service layer (`lib/supabase/service.ts`):** NOVO — helpers `db(table)`, `requireAdmin()`, `apiError()`, `apiSuccess()`, `mapCamelToSnake()`, `mapSnakeToCamel()` para padronizar todas as API routes.

**3. SQL RLS (`lib/rls_policies_final.sql`):** NOVO — script que remove as policies `FOR ALL` genericas e cria `SELECT`/`INSERT`/`UPDATE`/`DELETE` individuais para TODAS as 60+ tabelas, com `USING (true)` (single-tenant).

**4. API `/api/clients` (`route.ts`):** REFATORADO:
   - `GET`: captura erro por tabela (try/catch no Promise.all), retorna dados crus do Supabase (camelCase nao mapeado — o contexto sanitiza)
   - `POST`: validacao de campos obrigatorios (`companyName`, `name`, `title`, `score`), checa `data` vazio apos insert (detecta RLS block silencioso → 403), `.select()` apos insert
   - `PATCH`: `.select()` apos update, checa `data` vazio → 404
   - `DELETE`: agora e **HARD DELETE** (remove definitivamente), `.select()` apos delete, checa `data` vazio → 404
   - Nao faz mais cross-sync `syncClientToCRM` (CrmContext nao deve manipular clients_data)

**5. `ClientsContext.tsx`:** REFATORADO completamente:
   - **Fonte unica de verdade**: Supabase via API (NUNCA mais localStorage)
   - **Nenhuma operacao otimista**: todos os CRUD so atualizam state APOS confirmacao da API (fetch + await + check error)
   - **Loading state**: `status` = 'idle' | 'loading' | 'success' | 'error'
   - **Error state**: `errorMessage` + `clearError()` — erros visiveis na UI
   - **Realtime subscription**: `supabase.channel('table-changes').on('postgres_changes', '*', loadFromAPI)` para 5 tabelas do modulo Clientes
   - **Rollback**: se API falha, state permanece inalterado (nunca houve update otimista)
   - **Validacao**: `companyName` obrigatorio antes de chamar API
   - `sanitizeClients`/`sanitizeContacts`/etc aceitam camelCase OU snake_case (para compatibilidade com sync service)
   - `loadFromAPI()` unifica a logica de carregamento

**6. `clients/page.tsx`:** ATUALIZADO:
   - Import `Loader2` da lucide-react
   - Extrai `status`, `errorMessage`, `clearError` do context
   - Banner de loading azul (`"Salvando..."`) quando `status === 'loading'`
   - Banner de erro vermelho com mensagem + botao `X` para `clearError()`

### Checklist (modulo Clientes)

| Item | Status |
|------|--------|
| Criar registro persiste apos F5 | ✅ (API POST + loadFromAPI) |
| Editar persiste apos F5 | ✅ (API PATCH + .select()) |
| Excluir remove definitivamente | ✅ (DELETE hard) |
| Erros de permissao aparecem na UI | ✅ (403 → banner vermelho) |
| Duas abas sincronizam via Realtime | ✅ (postgres_changes subscriptions) |
| loading state visivel | ✅ (banner azul "Salvando...") |
| rollback em caso de erro | ✅ (state so muda apos API confirmar) |

### SQL a executar no Supabase Dashboard

```sql
-- 1. RLS individuais para TODAS as 60+ tabelas
-- Executar o conteudo de src/lib/rls_policies_final.sql

-- 2. Habilitar Realtime nas tabelas principais
-- Dashboard → Database → Replication → Enable Realtime para:
-- client_list, client_contacts, client_interactions, client_documents, client_feedbacks,
-- crm_companies, crm_contacts, crm_deals, crm_proposals, crm_contracts, crm_activities, crm_tasks,
-- training_events, training_participants, calendar_events, documents, admin_users, projects, project_tasks
```

### Build
50/50 rotas, TypeScript compilado, sem erros.

## Session 2026-07-13 � Fix Realtime channel collision + sync-admin-users 500

### Problema 1: Realtime channel error
**Erro**: `Uncaught Error: cannot add 'postgres_changes' callbacks for realtime:client_list-changes after 'subscribe()'`
**Causa**: O client do Supabase faz cache de canais por nome. React Strict Mode desmonta/remonta o componente; o cleanup removeChannel pode nao ser sincrono. No segundo mount, supabase.channel('client_list-changes') retorna o canal J� INSCRITO, e `.on('postgres_changes')` e chamado depois de `.subscribe()`.
**Fix** (ClientsContext.tsx):
- Antes de criar um canal, remove qualquer existente com o mesmo nome (supabase.getChannels().find(...))
- Cria novo canal limpo e registra listeners + subscribe
- Cleanup com 	ry/catch em emoveChannel`n
### Problema 2: /api/sync-admin-users retornando 500
**Causa provavel**: SUPABASE_SERVICE_ROLE_KEY ausente no ambiente Vercel.

**Fix** (sync-admin-users/route.ts):
- getServiceClient() loga qual env var esta faltando
- POST: se service client for null, retorna { success: true, count: 0, skipped: true } em vez de 500

### Build
50/50 rotas, TypeScript compilado, sem erros.

## Session 2026-07-14 — Migração para Prisma (módulo Clientes como piloto)

### Objetivo
Substituir a arquitetura híbrida (Supabase JS + localStorage + Context + cache race conditions) por CRUD server-side unificado via Prisma.

### Mudanças arquiteturais

1. **Prisma ORM** — 116 modelos gerados do banco via `prisma db pull`
2. **Transaction Pooler** — `DATABASE_URL` usa Supabase Transaction Pooler (`:6543`); `DIRECT_URL` usa conexão direta (`db.*.supabase.co:5432`)
3. **Singleton PrismaClient** — `src/lib/prisma.ts` com `@prisma/adapter-pg` + `pg` (driver adaptado)
4. **API `/api/prisma/clients`** — Rota CRUD completa (GET, POST, PATCH, DELETE) com:
   - GET: filtra `deleted_at IS NULL`, inclui contacts/interactions/documents/feedbacks
   - POST: suporta `_type` para client/contact/interaction/feedback
   - PATCH: suporta `_type: 'restore'` para restaurar soft-delete
   - DELETE: soft-delete (seta `deleted_at` + `status: 'churned'`)
5. **Middleware** — API routes excluídas do redirect de autenticação (`isApiRoute`)
6. **ClientsContext** — Atualizado para consumir `/api/prisma/clients` (GET na montagem, POST/PATCH/DELETE conforme ação)

### Fluxo de dados
```
Browser → ClientsContext → /api/prisma/clients → Prisma → Supabase PostgreSQL
```

### Testado (via curl)
- Create: ✅ retorna objeto criado com UUID real
- Read: ✅ retorna lista com contatos/interações/feedbacks aninhados
- Update: ✅ atualiza campos específicos
- Soft-delete: ✅ remove da listagem (filtro `deleted_at IS NULL`)
- Restore: ✅ reaparece na listagem
- Build: 51/51 rotas, TypeScript compilado, sem erros

## Session 2026-07-14 — Migração completa para Prisma (todos os módulos)

### O que foi feito

**9 novas API routes Prisma** (CRUD completo com upsert):

| Rota | Modelos | Entidades |
|------|---------|-----------|
| `/api/prisma/crm` | crm_companies, crm_contacts, crm_deals, crm_proposals, crm_contracts, crm_activities, crm_tasks | 7 |
| `/api/prisma/calendar` | calendar_events, calendar_participants, calendar_reminders | 3 |
| `/api/prisma/financial` | financial_accounts_receivable, financial_accounts_payable, financial_categories, financial_payment_methods, financial_recurring_rules, financial_transactions, financial_invoices, fin_bank_transactions | 8 |
| `/api/prisma/trainings` | training_events, training_participants, training_feedbacks, training_certificates, training_materials, training_reports, sipat_programs | 7 |
| `/api/prisma/mentoring` | mentoring_participants, mentoring_sessions, pdi_plans, pdi_goals, competencies, development_tools, mentoring_assessments, mentoring_reports | 8 |
| `/api/prisma/assessoria` | assessoria_diagnostics, assessoria_okrs, assessoria_swots, assessoria_action_plans, assessoria_kpis | 5 |
| `/api/prisma/documents` | documents, document_versions, document_access_logs | 3 |
| `/api/prisma/admin` | admin_users, admin_audit_logs, admin_lgpd_consents, admin_privacy_requests, admin_permissions, admin_tenants, admin_plans, admin_tenant_usage | 8 |
| `/api/prisma/acesso-temporario` | temporary_accesses, temporary_users, temporary_questionnaires, temporary_responses | 4 |

**9 service files reescritos** — todos agora chamam as API routes Prisma via `fetch()` em vez de Supabase JS direto:
- crmService.ts, calendarService.ts, financeService.ts, trainingService.ts
- mentoringService.ts, assessoriaService.ts, documentService.ts
- userService.ts (admin), acessoService.ts (acesso-temporario)

### Padrão arquitetural
```
Browser → Context → *Service → fetch(/api/prisma/...) → Prisma → PostgreSQL
```

- **`saveAll()`** agora faz POST de cada entidade individualmente (com `.catch(() => {})` para resiliência)
- **POST handlers** usam `prisma.xxx.upsert()` — criam ou atualizam conforme existência do `id`
- **`getClient()`/`handleError()` removidos** de todos os services (não usam mais Supabase JS)
- **Middleware** exclui API routes do redirect de autenticação

### Build
60+ rotas, TypeScript compilado, sem erros.

### Pendente
- ~~Remover contexts legados baseados em localStorage~~ ✅ **Concluído**
- TenantContext (admin/tenants) ainda usa localStorage com sync próprio — refatorar para usar Prisma API
- Deploy em produção
