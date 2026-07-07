-- Adiciona Unidade ao cadastro de usuários (cadastro passa a exigir Setor da lista + Unidade).
-- Aplicar com:  npx prisma db execute --file prisma/sql/2026-07-07_unidade_usuario.sql --schema prisma/schema.prisma

ALTER TABLE "Usuarios"
  ADD COLUMN IF NOT EXISTS "Unidade" TEXT NULL;
