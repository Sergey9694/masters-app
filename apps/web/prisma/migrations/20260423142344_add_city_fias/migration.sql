-- AlterTable
ALTER TABLE "City" ADD COLUMN     "fiasId" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "location" Unsupported("geography(Point, 4326)");

-- CreateIndex
CREATE UNIQUE INDEX "City_fiasId_key" ON "City"("fiasId");

-- CreateIndex
CREATE INDEX "City_location_idx" ON "City" USING GIST ("location");
