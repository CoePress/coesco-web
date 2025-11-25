-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('Call', 'Email', 'Meeting', 'TextChat', 'QuoteSent', 'QuotePresentation', 'Event', 'FormSubmission', 'WebsiteActivity', 'ContentDownloaded');

-- CreateEnum
CREATE TYPE "ActivitySentiment" AS ENUM ('Negative', 'Neutral', 'Positive');

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "sentiment" "ActivitySentiment" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_entityType_entityId_idx" ON "activities"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "activities_timestamp_idx" ON "activities"("timestamp");

-- CreateIndex
CREATE INDEX "activities_activityType_idx" ON "activities"("activityType");

-- CreateIndex
CREATE INDEX "activities_createdBy_idx" ON "activities"("createdBy");
