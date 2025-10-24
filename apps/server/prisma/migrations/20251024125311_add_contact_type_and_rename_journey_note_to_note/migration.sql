/*
  Warnings:

  - You are about to drop the `journey_notes` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('Accounting', 'Engineering', 'Inactive', 'Left_Company', 'Parts_Service', 'Sales');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "type" "ContactType" NOT NULL DEFAULT 'Sales';

-- DropTable
DROP TABLE "public"."journey_notes";

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "body" TEXT NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);
