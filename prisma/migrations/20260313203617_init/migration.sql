-- CreateEnum
CREATE TYPE "ProcurementStatus" AS ENUM ('DRAFT', 'IMPORTED', 'ANALYZED', 'REPORTED');

-- CreateEnum
CREATE TYPE "FlagLevel" AS ENUM ('NORMAL', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "status" "ProcurementStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "procurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_items" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemCode" TEXT,
    "unit" TEXT,
    "price" DECIMAL(12,4),
    "priceNote" TEXT,

    CONSTRAINT "line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_results" (
    "id" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalItems" INTEGER NOT NULL,
    "totalBids" INTEGER NOT NULL,
    "flaggedItems" INTEGER NOT NULL,
    "avgZScore" DOUBLE PRECISION,
    "maxZScore" DOUBLE PRECISION,

    CONSTRAINT "analysis_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_statistics" (
    "id" TEXT NOT NULL,
    "analysisResultId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "meanPrice" DECIMAL(12,4) NOT NULL,
    "medianPrice" DECIMAL(12,4) NOT NULL,
    "stdDev" DECIMAL(12,4) NOT NULL,
    "minPrice" DECIMAL(12,4) NOT NULL,
    "maxPrice" DECIMAL(12,4) NOT NULL,
    "priceRange" DECIMAL(12,4) NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "hasMissingPrices" BOOLEAN NOT NULL DEFAULT false,
    "hasZeroPrices" BOOLEAN NOT NULL DEFAULT false,
    "suspectedCollusion" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "item_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flag_results" (
    "id" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "itemStatisticId" TEXT NOT NULL,
    "zScore" DOUBLE PRECISION NOT NULL,
    "flagLevel" "FlagLevel" NOT NULL,
    "flagReason" TEXT,
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "flag_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "procurementId" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "analysis_results_procurementId_key" ON "analysis_results"("procurementId");

-- CreateIndex
CREATE UNIQUE INDEX "flag_results_lineItemId_key" ON "flag_results"("lineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "reports_procurementId_key" ON "reports"("procurementId");

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_bidId_fkey" FOREIGN KEY ("bidId") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_statistics" ADD CONSTRAINT "item_statistics_analysisResultId_fkey" FOREIGN KEY ("analysisResultId") REFERENCES "analysis_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_results" ADD CONSTRAINT "flag_results_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flag_results" ADD CONSTRAINT "flag_results_itemStatisticId_fkey" FOREIGN KEY ("itemStatisticId") REFERENCES "item_statistics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "procurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
