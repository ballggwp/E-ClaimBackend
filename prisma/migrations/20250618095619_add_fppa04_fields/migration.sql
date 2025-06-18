/*
  Warnings:

  - You are about to drop the column `amount` on the `Fppa04Item` table. All the data in the column will be lost.
  - Added the required column `policyNumber` to the `Fppa04` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exception` to the `Fppa04Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Fppa04Item` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `category` on the `Fppa04Item` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Fppa04" ADD COLUMN     "policyNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Fppa04Item" DROP COLUMN "amount",
ADD COLUMN     "exception" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Fppa04Adjustment" (
    "id" TEXT NOT NULL,
    "fppa04Id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Fppa04Adjustment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Fppa04Adjustment" ADD CONSTRAINT "Fppa04Adjustment_fppa04Id_fkey" FOREIGN KEY ("fppa04Id") REFERENCES "Fppa04"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
