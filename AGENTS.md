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
