-- Bypass com Assunção de Risco (Gestor → Portaria) + Saída por Terceiros
-- Aplicar com:  npx prisma db execute --file prisma/sql/2026-07-06_bypass_terceiros.sql --schema prisma/schema.prisma

ALTER TABLE "Solicitacoes"
  ADD COLUMN IF NOT EXISTS "IsBypassRH"    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "BypassMotivo"  TEXT    NULL,
  ADD COLUMN IF NOT EXISTS "ColaboradorId" INTEGER NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FK_Solicitacoes_Usuarios_ColaboradorId'
  ) THEN
    ALTER TABLE "Solicitacoes"
      ADD CONSTRAINT "FK_Solicitacoes_Usuarios_ColaboradorId"
      FOREIGN KEY ("ColaboradorId") REFERENCES "Usuarios"("Id") ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_Solicitacoes_ColaboradorId"   ON "Solicitacoes" ("ColaboradorId");
CREATE INDEX IF NOT EXISTS "IX_Solicitacoes_Bypass_Pendente" ON "Solicitacoes" ("IsBypassRH", "RHAprovadorId");
