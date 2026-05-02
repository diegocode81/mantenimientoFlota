-- Backfill existing records so the type reflects the operational state.
UPDATE "MantenimientoVehiculo"
SET "tipoMantenimiento" = 'OPERATIVO'
WHERE "estado" = 'OPERATIVO' AND "tipoMantenimiento" IS NULL;

UPDATE "MantenimientoVehiculo"
SET "tipoMantenimiento" = 'PREVENTIVO'
WHERE "estado" = 'MANTENIMIENTO' AND "tipoMantenimiento" IS NULL;

-- Keep new operational records explicit instead of null.
ALTER TABLE "MantenimientoVehiculo"
ALTER COLUMN "tipoMantenimiento" SET DEFAULT 'OPERATIVO',
ALTER COLUMN "tipoMantenimiento" SET NOT NULL;
