<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Session 2026-06-14

### Changes Made
- **Middleware mock session** (`src/utils/supabase/middleware.ts`): Parse `sb-mock-session` como JSON (`{ userId, userName, userRole }`) com fallback para formato `'true'` antigo
- **Settings restrito** (`src/app/(dashboard)/settings/page.tsx`): Apenas `Administrador` e `Diretor` acessam; outros veem tela "Acesso Restrito" com `AlertTriangle`
- **Modal de senha** no Settings: Botão `KeyRound` na tabela de usuários → modal com nova senha + confirmação, validação, `updateUser` + audit log
- **Build verificado**: 50 rotas, sem erros
