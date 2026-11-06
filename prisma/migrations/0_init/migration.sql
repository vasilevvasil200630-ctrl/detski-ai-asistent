-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "KgRole" AS ENUM ('ADMIN', 'TEACHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '👩‍🏫',
    "jobTitle" TEXT NOT NULL DEFAULT 'Учител',
    "ageGroup" TEXT NOT NULL DEFAULT '2',
    "groupName" TEXT NOT NULL DEFAULT '',
    "kgRole" "KgRole" NOT NULL DEFAULT 'TEACHER',
    "kindergartenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kindergarten" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "motto" TEXT NOT NULL DEFAULT '',
    "joinCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kindergarten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankGame" (
    "id" TEXT NOT NULL,
    "kindergartenId" TEXT NOT NULL,
    "authorId" TEXT,
    "ageGroup" TEXT NOT NULL,
    "mood" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "resources" TEXT NOT NULL,
    "game" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankGameLike" (
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankGameLike_pkey" PRIMARY KEY ("userId","gameId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_kindergartenId_idx" ON "User"("kindergartenId");

-- CreateIndex
CREATE UNIQUE INDEX "Kindergarten_joinCode_key" ON "Kindergarten"("joinCode");

-- CreateIndex
CREATE INDEX "BankGame_kindergartenId_createdAt_idx" ON "BankGame"("kindergartenId", "createdAt");

-- CreateIndex
CREATE INDEX "BankGame_ageGroup_idx" ON "BankGame"("ageGroup");

-- CreateIndex
CREATE INDEX "BankGameLike_gameId_idx" ON "BankGameLike"("gameId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_kindergartenId_fkey" FOREIGN KEY ("kindergartenId") REFERENCES "Kindergarten"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankGame" ADD CONSTRAINT "BankGame_kindergartenId_fkey" FOREIGN KEY ("kindergartenId") REFERENCES "Kindergarten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankGame" ADD CONSTRAINT "BankGame_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankGameLike" ADD CONSTRAINT "BankGameLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankGameLike" ADD CONSTRAINT "BankGameLike_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "BankGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

