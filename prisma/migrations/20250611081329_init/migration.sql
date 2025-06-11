/*
  Warnings:

  - You are about to drop the column `insuranceId` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `managerId` on the `Claim` table. All the data in the column will be lost.
  - Added the required column `approverId` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Claim" DROP CONSTRAINT "Claim_insuranceId_fkey";

-- DropForeignKey
ALTER TABLE "Claim" DROP CONSTRAINT "Claim_managerId_fkey";

-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "insuranceId",
DROP COLUMN "managerId",
ADD COLUMN     "approverId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
