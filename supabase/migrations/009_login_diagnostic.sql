-- Diagnostic 009: verificar usuarios admin@crepaldidh.com.br (sem alterar esquema)
-- Apenas NOTICES para log; nada é criado/modificado.
DO $$
DECLARE
  auth_rows int := 0;
  adm_rows int := 0;
  pw_len int := 0;
  r record;
BEGIN
  SELECT count(*) INTO auth_rows FROM auth.users WHERE email = 'admin@crepaldidh.com.br';
  RAISE NOTICE '[DIAG] auth.users rows = %', auth_rows;

  SELECT count(*) INTO adm_rows FROM admin_users WHERE email = 'admin@crepaldidh.com.br';
  RAISE NOTICE '[DIAG] admin_users rows = %', adm_rows;

  IF adm_rows > 0 THEN
    SELECT LENGTH(password) INTO pw_len FROM admin_users WHERE email = 'admin@crepaldidh.com.br';
    RAISE NOTICE '[DIAG] admin_users.password length = %', pw_len;
  END IF;
END $$;
