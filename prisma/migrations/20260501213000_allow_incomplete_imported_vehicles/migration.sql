-- AlterTable
ALTER TABLE "Vehiculo"
ADD COLUMN "itemOrigen" TEXT,
ADD COLUMN "anoOriginal" TEXT,
ALTER COLUMN "placa" DROP NOT NULL,
ALTER COLUMN "disco" DROP NOT NULL,
ALTER COLUMN "marca" DROP NOT NULL,
ALTER COLUMN "ano" DROP NOT NULL,
ALTER COLUMN "cia" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Vehiculo_itemOrigen_idx" ON "Vehiculo"("itemOrigen");
