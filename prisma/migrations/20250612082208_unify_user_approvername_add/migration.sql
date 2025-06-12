/*
  Warnings:

  - Added the required column `approverName` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdByName` to the `Claim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "approverName" TEXT NOT NULL,
ADD COLUMN     "createdByName" TEXT NOT NULL;
