-- CreateTable
CREATE TABLE "company_relationships" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "relationshipType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "company_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_relationships_createdById_idx" ON "company_relationships"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "company_relationships_parentId_childId_key" ON "company_relationships"("parentId", "childId");
