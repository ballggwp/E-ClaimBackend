/*
  Warnings:

  - Added the required column `netAmount` to the `Fppa04` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Fppa04" ADD COLUMN     "netAmount" DOUBLE PRECISION NOT NULL;
