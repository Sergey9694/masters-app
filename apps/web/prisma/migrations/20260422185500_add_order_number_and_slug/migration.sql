-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderNumber" SERIAL NOT NULL;
ALTER TABLE "Order" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Order_slug_key" ON "Order"("slug");
