-- CreateEnum
CREATE TYPE "EstadoVehiculo" AS ENUM ('OPERATIVO', 'MANTENIMIENTO');

-- CreateTable
CREATE TABLE "VehiculoMantenimiento" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "disco" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "cia" TEXT NOT NULL,
    "fechaMantenimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoVehiculo" NOT NULL,
    "observaciones" TEXT,
    "rutaUbicacion" TEXT NOT NULL,
    "tecnicosDesignados" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiculoMantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehiculoMantenimiento_placa_idx" ON "VehiculoMantenimiento"("placa");

-- CreateIndex
CREATE INDEX "VehiculoMantenimiento_estado_idx" ON "VehiculoMantenimiento"("estado");

-- CreateIndex
CREATE INDEX "VehiculoMantenimiento_fechaMantenimiento_idx" ON "VehiculoMantenimiento"("fechaMantenimiento");
