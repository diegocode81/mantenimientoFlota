ALTER TABLE "Usuario"
ADD COLUMN "nombre" TEXT,
ADD COLUMN "apellido" TEXT,
ADD COLUMN "correo" TEXT;

CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
CREATE INDEX "Usuario_correo_idx" ON "Usuario"("correo");
