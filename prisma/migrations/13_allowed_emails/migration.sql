-- CreateTable
CREATE TABLE "AllowedEmail" (
    "id" TEXT NOT NULL,
    "kindergartenId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AllowedEmail_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "AllowedEmail_kindergartenId_email_key" ON "AllowedEmail"("kindergartenId", "email");
-- AddForeignKey
ALTER TABLE "AllowedEmail" ADD CONSTRAINT "AllowedEmail_kindergartenId_fkey" FOREIGN KEY ("kindergartenId") REFERENCES "Kindergarten"("id") ON DELETE CASCADE ON UPDATE CASCADE;
