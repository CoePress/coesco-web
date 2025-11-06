-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "imageId" INTEGER,
ADD COLUMN     "profileUrl" TEXT;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
