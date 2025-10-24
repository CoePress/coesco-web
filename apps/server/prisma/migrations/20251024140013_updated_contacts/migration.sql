-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "addressId" TEXT,
ADD COLUMN     "legacyCompanyId" TEXT,
ADD COLUMN     "phoneExtension" TEXT;

-- CreateTable
CREATE TABLE "journey_contacts" (
    "id" TEXT NOT NULL,
    "journeyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "journey_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journey_contacts_journeyId_idx" ON "journey_contacts"("journeyId");

-- CreateIndex
CREATE INDEX "journey_contacts_contactId_idx" ON "journey_contacts"("contactId");

-- CreateIndex
CREATE INDEX "journey_contacts_createdById_idx" ON "journey_contacts"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "journey_contacts_journeyId_contactId_key" ON "journey_contacts"("journeyId", "contactId");

-- CreateIndex
CREATE INDEX "contacts_companyId_idx" ON "contacts"("companyId");

-- CreateIndex
CREATE INDEX "contacts_legacyCompanyId_idx" ON "contacts"("legacyCompanyId");

-- AddForeignKey
ALTER TABLE "journey_contacts" ADD CONSTRAINT "journey_contacts_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
