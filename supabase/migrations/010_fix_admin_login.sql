-- Fix 010: sincronizar senha admin@crepaldidh.com.br no auth.users
-- (evita divergencia: senha texto plano 'admin123' em admin_users != hash no Auth)
-- Usa apenas crypt + gen_salt('bf') (builtin Postgres, sem custo extra).

UPDATE auth.users
SET encrypted_password = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@crepaldidh.com.br'
  AND encrypted_password IS NULL;

-- Nota: se encrypted_password ja existir, o Auth sign-in bate contra ele.
-- Aqui garantimos que, se estiver NULL, o login sobrevivera via fallback legado.
DO $$
DECLARE a boolean; d boolean;
BEGIN
  SELECT encrypted_password IS NOT NULL INTO a
  FROM auth.users WHERE email = 'admin@crepaldidh.com.br';
  SELECT password = 'admin123' INTO d
  FROM admin_users WHERE email = 'admin@crepaldidh.com.br';
  RAISE NOTICE '[FIX010] auth has password=% ; admin_users pw=admin123=%', a, d;
END $$;
