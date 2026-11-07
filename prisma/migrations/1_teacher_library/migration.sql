-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('GAME', 'LESSON', 'MATERIAL');
-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "authorId" TEXT,
    "kindergartenId" TEXT,
    "kind" "MaterialKind" NOT NULL,
    "title" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "direction" TEXT,
    "core" TEXT,
    "holiday" TEXT,
    "meta" JSONB,
    "content" JSONB NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT false,
    "sharedAt" TIMESTAMP(3),
    "copiedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "MaterialLike" (
    "userId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialLike_pkey" PRIMARY KEY ("userId","materialId")
);
-- CreateIndex
CREATE INDEX "Material_authorId_ageGroup_idx" ON "Material"("authorId", "ageGroup");
-- CreateIndex
CREATE INDEX "Material_kindergartenId_shared_createdAt_idx" ON "Material"("kindergartenId", "shared", "createdAt");
-- CreateIndex
CREATE INDEX "Material_holiday_idx" ON "Material"("holiday");
-- CreateIndex
CREATE INDEX "MaterialLike_materialId_idx" ON "MaterialLike"("materialId");
-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_kindergartenId_fkey" FOREIGN KEY ("kindergartenId") REFERENCES "Kindergarten"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MaterialLike" ADD CONSTRAINT "MaterialLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "MaterialLike" ADD CONSTRAINT "MaterialLike_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: игрите от колективната банка стават споделени материали (същите id), заедно с харесванията.
-- Старите таблици BankGame/BankGameLike остават непроменени.
INSERT INTO "Material" ("id", "authorId", "kindergartenId", "kind", "title", "ageGroup", "meta", "content", "shared", "sharedAt", "createdAt", "updatedAt")
SELECT
    b."id",
    b."authorId",
    b."kindergartenId",
    'GAME'::"MaterialKind",
    COALESCE(NULLIF(b."game"->>'title', ''), 'Игра'),
    b."ageGroup",
    jsonb_build_object('mood', b."mood", 'location', b."location", 'resources', b."resources"),
    b."game",
    true,
    b."createdAt",
    b."createdAt",
    b."createdAt"
FROM "BankGame" b
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "MaterialLike" ("userId", "materialId", "createdAt")
SELECT l."userId", l."gameId", l."createdAt"
FROM "BankGameLike" l
ON CONFLICT ("userId", "materialId") DO NOTHING;
