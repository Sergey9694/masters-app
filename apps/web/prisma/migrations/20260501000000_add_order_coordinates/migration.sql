-- Store order coordinates separately for UI/API responses and keep PostGIS for radius queries.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "Order_cityId_categoryId_status_idx" ON "Order"("cityId", "categoryId", "status");
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_lat_lng_idx" ON "Order"("lat", "lng");
CREATE INDEX IF NOT EXISTS "Order_orderLocation_gist_idx" ON "Order" USING GIST ("orderLocation");
