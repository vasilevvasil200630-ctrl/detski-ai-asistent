-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "dueTime" TEXT,
ADD COLUMN     "remindDays" INTEGER,
ADD COLUMN     "snoozedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calendarToken" TEXT;

-- CreateIndex
CREATE INDEX "Note_userId_done_dueDate_idx" ON "Note"("userId", "done", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "User_calendarToken_key" ON "User"("calendarToken");


-- Досегашните задачи със срок напомнят в деня
UPDATE "Note" SET "remindDays" = 0 WHERE "dueDate" IS NOT NULL AND "done" = false;
