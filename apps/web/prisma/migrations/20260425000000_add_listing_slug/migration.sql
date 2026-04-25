-- AlterTable
ALTER TABLE "ServiceListing" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceListing_slug_key" ON "ServiceListing"("slug");