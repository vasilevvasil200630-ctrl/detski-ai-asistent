-- CreateTable
CREATE TABLE "ThematicPlan" (
    "id" TEXT NOT NULL,
    "kindergartenId" TEXT NOT NULL,
    "authorId" TEXT,
    "ageGroup" TEXT NOT NULL,
    "groupName" TEXT NOT NULL DEFAULT '',
    "schoolYear" INTEGER NOT NULL,
    "shared" BOOLEAN NOT NULL DEFAULT true,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThematicPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThematicWeek" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "theme" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "situations" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "ThematicWeek_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThematicPlan_kindergartenId_schoolYear_idx" ON "ThematicPlan"("kindergartenId", "schoolYear");

-- CreateIndex
CREATE UNIQUE INDEX "ThematicPlan_authorId_ageGroup_schoolYear_key" ON "ThematicPlan"("authorId", "ageGroup", "schoolYear");

-- CreateIndex
CREATE UNIQUE INDEX "ThematicWeek_planId_week_key" ON "ThematicWeek"("planId", "week");

-- AddForeignKey
ALTER TABLE "ThematicPlan" ADD CONSTRAINT "ThematicPlan_kindergartenId_fkey" FOREIGN KEY ("kindergartenId") REFERENCES "Kindergarten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThematicPlan" ADD CONSTRAINT "ThematicPlan_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThematicPlan" ADD CONSTRAINT "ThematicPlan_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThematicWeek" ADD CONSTRAINT "ThematicWeek_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ThematicPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

