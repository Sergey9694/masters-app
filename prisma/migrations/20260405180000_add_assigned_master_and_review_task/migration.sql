-- AlterTable
ALTER TABLE "TaskRequest" ADD COLUMN "assignedMasterId" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "taskId" TEXT;

-- Если в проде/локалке уже есть записи Review без taskId — заполнить их нельзя без ручного вмешательства,
-- поэтому до выставления NOT NULL удалим их (в MVP-фазе отзывов ещё нет).
DELETE FROM "Review" WHERE "taskId" IS NULL;

ALTER TABLE "Review" ALTER COLUMN "taskId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Review_taskId_key" ON "Review"("taskId");

-- AddForeignKey
ALTER TABLE "TaskRequest" ADD CONSTRAINT "TaskRequest_assignedMasterId_fkey" FOREIGN KEY ("assignedMasterId") REFERENCES "MasterProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
