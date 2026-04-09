-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "MasterProfile" ADD COLUMN     "experienceYears" INTEGER,
ADD COLUMN     "minPrice" DOUBLE PRECISION,
ADD COLUMN     "portfolio" TEXT[];
