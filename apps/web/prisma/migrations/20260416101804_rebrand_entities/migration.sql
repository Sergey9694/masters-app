/*
  Warnings:

  - The values [NEW_RESPONSE,RESPONSE_ACCEPTED,TASK_COMPLETED,TASK_CANCELED,NEW_TASK] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - The values [MASTER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `taskId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `masterId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the `MasterCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MasterProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskResponse` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[orderId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'EXPIRED');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('NEW_PROPOSAL', 'PROPOSAL_ACCEPTED', 'ORDER_COMPLETED', 'ORDER_CANCELED', 'NEW_REVIEW', 'NEW_ORDER');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'PROVIDER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "MasterCategory" DROP CONSTRAINT "MasterCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "MasterCategory" DROP CONSTRAINT "MasterCategory_masterId_fkey";

-- DropForeignKey
ALTER TABLE "MasterProfile" DROP CONSTRAINT "MasterProfile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_masterId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskRequest" DROP CONSTRAINT "TaskRequest_assignedMasterId_fkey";

-- DropForeignKey
ALTER TABLE "TaskRequest" DROP CONSTRAINT "TaskRequest_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "TaskRequest" DROP CONSTRAINT "TaskRequest_customerId_fkey";

-- DropForeignKey
ALTER TABLE "TaskResponse" DROP CONSTRAINT "TaskResponse_masterId_fkey";

-- DropForeignKey
ALTER TABLE "TaskResponse" DROP CONSTRAINT "TaskResponse_taskId_fkey";

-- DropIndex
DROP INDEX "Review_taskId_key";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "taskId",
ADD COLUMN     "referenceId" TEXT;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "masterId",
DROP COLUMN "taskId",
ADD COLUMN     "orderId" TEXT NOT NULL,
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;

-- DropTable
DROP TABLE "MasterCategory";

-- DropTable
DROP TABLE "MasterProfile";

-- DropTable
DROP TABLE "TaskRequest";

-- DropTable
DROP TABLE "TaskResponse";

-- DropEnum
DROP TYPE "TaskStatus";

-- CreateTable
CREATE TABLE "ProviderProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "experienceYears" INTEGER,
    "portfolio" TEXT[],
    "minPrice" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isLocal" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,

    CONSTRAINT "ProviderProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceListing" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "images" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedProviderId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "budget" DOUBLE PRECISION,
    "address" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'OPEN',
    "orderLocation" geometry(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCategory" (
    "providerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ProviderCategory_pkey" PRIMARY KEY ("providerId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderProfile_userId_key" ON "ProviderProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_orderId_key" ON "Review"("orderId");

-- AddForeignKey
ALTER TABLE "ProviderProfile" ADD CONSTRAINT "ProviderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceListing" ADD CONSTRAINT "ServiceListing_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceListing" ADD CONSTRAINT "ServiceListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedProviderId_fkey" FOREIGN KEY ("assignedProviderId") REFERENCES "ProviderProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCategory" ADD CONSTRAINT "ProviderCategory_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderCategory" ADD CONSTRAINT "ProviderCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
