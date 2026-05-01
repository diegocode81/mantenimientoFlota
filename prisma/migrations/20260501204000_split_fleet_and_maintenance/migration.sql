-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "disco" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "cia" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehiculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MantenimientoVehiculo" (
    "id" TEXT NOT NULL,
    "vehiculoId" TEXT NOT NULL,
    "fechaMantenimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoVehiculo" NOT NULL,
    "rutaUbicacion" TEXT NOT NULL,
    "tecnicosDesignados" TEXT NOT NULL,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MantenimientoVehiculo_pkey" PRIMARY KEY ("id")
);

-- Copy existing combined records into the new fleet table.
INSERT INTO "Vehiculo" ("id", "placa", "disco", "marca", "tipo", "ano", "cia", "createdAt", "updatedAt")
SELECT DISTINCT ON ("placa")
    "id",
    "placa",
    "disco",
    "marca",
    "tipo",
    "ano",
    "cia",
    "createdAt",
    "updatedAt"
FROM "VehiculoMantenimiento"
ORDER BY "placa", "updatedAt" DESC;

-- Copy existing maintenance fields and connect them to the vehicle by plate.
INSERT INTO "MantenimientoVehiculo" (
    "id",
    "vehiculoId",
    "fechaMantenimiento",
    "estado",
    "rutaUbicacion",
    "tecnicosDesignados",
    "observaciones",
    "createdAt",
    "updatedAt"
)
SELECT
    old."id",
    vehicle."id",
    old."fechaMantenimiento",
    old."estado",
    old."rutaUbicacion",
    old."tecnicosDesignados",
    old."observaciones",
    old."createdAt",
    old."updatedAt"
FROM "VehiculoMantenimiento" old
JOIN "Vehiculo" vehicle ON vehicle."placa" = old."placa";

-- Drop old indexes and table.
DROP INDEX IF EXISTS "VehiculoMantenimiento_placa_idx";
DROP INDEX IF EXISTS "VehiculoMantenimiento_estado_idx";
DROP INDEX IF EXISTS "VehiculoMantenimiento_fechaMantenimiento_idx";
DROP TABLE "VehiculoMantenimiento";

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_placa_key" ON "Vehiculo"("placa");

-- CreateIndex
CREATE INDEX "Vehiculo_marca_idx" ON "Vehiculo"("marca");

-- CreateIndex
CREATE INDEX "Vehiculo_cia_idx" ON "Vehiculo"("cia");

-- CreateIndex
CREATE INDEX "MantenimientoVehiculo_vehiculoId_idx" ON "MantenimientoVehiculo"("vehiculoId");

-- CreateIndex
CREATE INDEX "MantenimientoVehiculo_estado_idx" ON "MantenimientoVehiculo"("estado");

-- CreateIndex
CREATE INDEX "MantenimientoVehiculo_fechaMantenimiento_idx" ON "MantenimientoVehiculo"("fechaMantenimiento");

-- AddForeignKey
ALTER TABLE "MantenimientoVehiculo" ADD CONSTRAINT "MantenimientoVehiculo_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
