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
