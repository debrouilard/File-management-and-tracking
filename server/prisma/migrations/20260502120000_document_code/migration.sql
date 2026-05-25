-- User-facing document ID (numeric string); backfilled from existing fileNumber.
ALTER TABLE "FileRecord" ADD COLUMN "documentCode" TEXT;

UPDATE "FileRecord" SET "documentCode" = CAST("fileNumber" AS TEXT) WHERE "documentCode" IS NULL;

ALTER TABLE "FileRecord" ALTER COLUMN "documentCode" SET NOT NULL;

CREATE UNIQUE INDEX "FileRecord_documentCode_key" ON "FileRecord"("documentCode");
