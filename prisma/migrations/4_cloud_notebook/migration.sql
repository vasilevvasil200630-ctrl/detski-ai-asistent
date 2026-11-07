-- Общ облак на градината (CloudFile, CloudFileData) и личен бележник (Note).

-- CreateTable
CREATE TABLE "CloudFile" (
    "id" TEXT NOT NULL,
    "kindergartenId" TEXT NOT NULL,
    "uploaderId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "folder" TEXT NOT NULL DEFAULT 'other',
    "ageGroup" TEXT,
    "direction" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storage" TEXT NOT NULL,
    "blobPathname" TEXT,
    "shared" BOOLEAN NOT NULL DEFAULT true,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudFileData" (
    "fileId" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,

    CONSTRAINT "CloudFileData_pkey" PRIMARY KEY ("fileId")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'yellow',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CloudFile_blobPathname_key" ON "CloudFile"("blobPathname");

-- CreateIndex
CREATE INDEX "CloudFile_kindergartenId_shared_createdAt_idx" ON "CloudFile"("kindergartenId", "shared", "createdAt");

-- CreateIndex
CREATE INDEX "CloudFile_uploaderId_createdAt_idx" ON "CloudFile"("uploaderId", "createdAt");

-- CreateIndex
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "CloudFile" ADD CONSTRAINT "CloudFile_kindergartenId_fkey" FOREIGN KEY ("kindergartenId") REFERENCES "Kindergarten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudFile" ADD CONSTRAINT "CloudFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloudFileData" ADD CONSTRAINT "CloudFileData_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "CloudFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

