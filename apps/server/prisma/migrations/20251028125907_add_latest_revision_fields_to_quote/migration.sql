-- AlterTable
ALTER TABLE "quote_headers" ADD COLUMN     "latestRevision" TEXT,
ADD COLUMN     "latestRevisionStatus" "QuoteRevisionStatus",
ADD COLUMN     "latestRevisionTotalAmount" DECIMAL(65,30);
