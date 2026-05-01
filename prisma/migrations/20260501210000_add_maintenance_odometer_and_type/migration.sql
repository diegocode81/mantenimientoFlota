-- CreateEnum
CREATE TYPE "TipoMantenimiento" AS ENUM ('CORRECTIVO', 'PREVENTIVO', 'PROACTIVO');

-- AlterTable
ALTER TABLE "MantenimientoVehiculo"
ADD COLUMN "kilometrajeOdometro" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "tipoMantenimiento" "TipoMantenimiento" NOT NULL DEFAULT 'PREVENTIVO';

-- CreateIndex
CREATE INDEX "MantenimientoVehiculo_tipoMantenimiento_idx" ON "MantenimientoVehiculo"("tipoMantenimiento");
