-- Панел на директора: временна парола и премахнати от екипа.

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "removedAt" TIMESTAMP(3),
ADD COLUMN     "removedFromKindergartenId" TEXT;

