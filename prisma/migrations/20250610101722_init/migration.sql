-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'PENDING_INSURER_REVIEW', 'AWAITING_EVIDENCE', 'PENDING_MANAGER_REVIEW', 'PENDING_USER_CONFIRM', 'AWAITING_SIGNATURES', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('DAMAGE_IMAGE', 'ESTIMATE_DOC', 'OTHER_DOCUMENT');

-- CreateEnum
CREATE TYPE "Fppa04ItemCategory" AS ENUM ('COMPENSATION', 'DEDUCTION');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "insuranceId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "accidentDate" TIMESTAMP(3) NOT NULL,
    "accidentTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "policeDate" TIMESTAMP(3),
    "policeTime" TEXT,
    "policeStation" TEXT,
    "damageOwnType" TEXT NOT NULL,
    "damageOtherOwn" TEXT,
    "damageAmount" DOUBLE PRECISION,
    "damageDetail" TEXT,
    "victimDetail" TEXT,
    "partnerName" TEXT,
    "partnerPhone" TEXT,
    "partnerLocation" TEXT,
    "partnerDamageDetail" TEXT,
    "partnerDamageAmount" DOUBLE PRECISION,
    "partnerVictimDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fppa04" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "claimRefNumber" TEXT NOT NULL,
    "eventDescription" TEXT NOT NULL,
    "productionYear" INTEGER NOT NULL,
    "accidentDate" TIMESTAMP(3) NOT NULL,
    "reportedDate" TIMESTAMP(3) NOT NULL,
    "receivedDocDate" TIMESTAMP(3) NOT NULL,
    "company" TEXT NOT NULL,
    "factory" TEXT NOT NULL,
    "surveyorRefNumber" TEXT NOT NULL,
    "signatureFiles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fppa04_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fppa04Item" (
    "id" TEXT NOT NULL,
    "fppa04Id" TEXT NOT NULL,
    "category" "Fppa04ItemCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Fppa04Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fppa04_claimId_key" ON "Fppa04"("claimId");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fppa04" ADD CONSTRAINT "Fppa04_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fppa04Item" ADD CONSTRAINT "Fppa04Item_fppa04Id_fkey" FOREIGN KEY ("fppa04Id") REFERENCES "Fppa04"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
