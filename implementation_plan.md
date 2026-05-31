# NR01 & Psychosocial Diagnosis Full Workflow Implementation Plan

## Goal
Create a complete, production‑ready flow for the NR01 and Diagnóstico Psicossocial modules, covering:
1. **Client → Project → NR01** integration.
2. **Supabase** persistence for all entities (clients, projects, diagnostics, units, sectors, risks, evidences, action plans, reports).
3. **Risk matrix** calculation and visualisation.
4. **Evidence upload** (Supabase Storage).
5. **PDF report generation**.
6. **Filtering, responsive UI, permissions, and polished design**.

---

## User Review Required
- **PDF library**: confirm you want to use `@react-pdf/renderer` (default) or another.
- **Roles/permissions**: list which roles can perform each action (create/delete/etc.).
- **UI design language**: any brand colours, fonts, or style guide? (We will use Inter, gradient primary colour #4a90e2, dark mode, glassmorphism.)
- **Supabase bucket name** for evidence files (default: `evidences`).
- **Test environment**: do you have a Supabase project already configured? Provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.

---

## Open Questions
- Should the **risk matrix** be a heat‑map grid or a simple table? (We plan a CSS grid heat‑map.)
- Do you need **export CSV** of the matrix?
- Are there any existing UI pages for projects that we must extend, or should we scaffold new ones?
- Do you want **automatic conversion**: when a contract is approved, create a client and a default NR01 project? (Yes, we will implement as a background effect in the provider.)

---

## Proposed Changes
### 1. Supabase Service Layer
- **File:** `src/lib/supabaseService.ts`
- Functions for each entity: `createClient`, `linkProjectToClient`, `createProject`, `createDiagnostic`, `addUnit`, `addSector`, `addRisk`, `uploadEvidence`, `addActionPlan`, `generateReport`, `fetch*` (list with filters).
- Each function returns the inserted row (including generated UUID).
- Apply **RLS policies** – only admin can delete, consultants can add evidences, etc.

### 2. Extend Supabase Context
- Update `SupabaseProvider` to expose `supabaseService` together with `supabase`.
- Add a hook `useSupabaseService`.

### 3. Update CrmContext
- Replace the local‑storage based NR01 mutators with calls to `supabaseService`.
- Keep existing CRM CRUD in local storage for now (or later migrate).
- Add permission checks inside mutators (use `currentRole`).
- Expose new state setters that refresh from Supabase after each mutation.

### 4. UI Pages & Wizard
- **Create Client** (`/clients/create`).
- **Create Project** (`/projects/create`) – dropdown to select client, auto‑populate contract.
- **NR01 Wizard** (`/nr01/create`): steps
  1. Diagnostic details
  2. Units (add multiple)
  3. Sectors per unit
  4. Risks per sector (enter probability & impact → level auto‑calc)
  5. Evidence upload (using `EvidenceUploader` component)
  6. Action plans per risk
  7. Review & generate PDF.
- All pages use **React Hook Form** + validation, styled with premium glassmorphism cards.

### 5. Components
- `RiskMatrix.tsx` – renders heat‑map, colors based on `level` (green/yellow/red) and shows tooltip with probability/impact.
- `EvidenceUploader.tsx` – drag‑and‑drop, uploads to Supabase storage bucket, returns URL.
- `ActionPlanTable.tsx` – editable table with status toggle.
- `ReportGeneratorButton.tsx` – triggers PDF creation, shows progress spinner.

### 6. PDF Generation
- **File:** `src/lib/pdfReport.tsx`
- Use `@react-pdf/renderer` to build a PDF containing:
  - Header with logo, client & project info.
  - Diagnostic data, unit/sector tables.
  - Risk matrix (rendered as an image via canvas → data‑url).
  - List of evidences (download links).
  - Action plans and their status.
- Upload PDF to Supabase storage, insert row in `reports` table.

### 7. Filtering & Responsiveness
- Add query‑param based filters on list pages (`/nr01?client=xxx&unit=yyy`).
- Use CSS Grid/Flex with media queries – mobile first, then tablet/desktop breakpoints.
- Implement dark‑mode toggle stored in local storage.

### 8. Permissions UI
- Extend `UserRole` enum if needed.
- In components, conditionally render buttons based on `currentRole` (e.g., delete risk only for admin).
- Show toast notifications when an unauthorized action is attempted.

### 9. Tests
- **Unit tests** for `supabaseService` using `jest` and `@supabase/supabase-js` mock.
- **E2E tests** with Playwright covering the entire flow listed in the user request.
- Add CI script in `package.json` → `npm test && npm run e2e`.

### 10. Documentation & SEO
- Add `<title>` and `<meta name="description">` per page.
- Add `README.md` with flow diagram (Mermaid) and API endpoint list.

---

## Verification Plan
1. **Run `supabase db push`** to apply schema.
2. Launch app (`npm run dev`).
3. Execute Playwright end‑to‑end test – verify all steps succeed and PDF is downloadable.
4. Manually inspect UI on mobile & desktop for responsiveness.
5. Check Supabase dashboard: records created, files stored, RLS policies enforced.
6. Verify role‑based button visibility.

---

## Timeline (estimated)
| Phase | Tasks | Approx. Hours |
|-------|-------|---------------|
| 1 | Service layer & Supabase context | 4 |
| 2 | Update CrmContext mutators | 3 |
| 3 | UI pages & wizard (forms, navigation) | 8 |
| 4 | Components (matrix, uploader, action plans) | 5 |
| 5 | PDF generation & storage | 4 |
| 6 | Permissions, filters, responsiveness | 4 |
| 7 | Tests (unit + e2e) | 6 |
| 8 | Docs & SEO | 2 |
| **Total** |  | **36 hrs** |

---

### Next Step
Please confirm the open questions (PDF library, roles, bucket name, UI style) and approve the plan so we can start implementation.
