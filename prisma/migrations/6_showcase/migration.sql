-- CreateEnum
CREATE TYPE "ShowcaseStatus" AS ENUM ('PENDING', 'APPROVED', 'RETURNED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showcaseBio" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "ShowcaseItem" (
    "id" TEXT NOT NULL,
    "kindergartenId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "materialId" TEXT,
    "kind" "MaterialKind" NOT NULL,
    "title" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "direction" TEXT,
    "holiday" TEXT,
    "content" JSONB NOT NULL,
    "imageIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowPrint" BOOLEAN NOT NULL DEFAULT true,
    "status" "ShowcaseStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowcaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShowcaseItem_kindergartenId_status_publishedAt_idx" ON "ShowcaseItem"("kindergartenId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "ShowcaseItem_authorId_createdAt_idx" ON "ShowcaseItem"("authorId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShowcaseItem" ADD CONSTRAINT "ShowcaseItem_kindergartenId_fkey" FOREIGN KEY ("kindergartenId") REFERENCES "Kindergarten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcaseItem" ADD CONSTRAINT "ShowcaseItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowcaseItem" ADD CONSTRAINT "ShowcaseItem_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

