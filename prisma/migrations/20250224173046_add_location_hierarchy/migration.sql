/*
  Warnings:

  - A unique constraint covering the columns `[fullPath]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullPath` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- First, add the new columns that can be null
ALTER TABLE "Location" ADD COLUMN "parentId" TEXT;
ALTER TABLE "Location" ADD COLUMN "path" TEXT NOT NULL DEFAULT '/';
ALTER TABLE "Location" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Location" ADD COLUMN "fullPath" TEXT;

-- Update fullPath for existing locations
UPDATE "Location" SET "fullPath" = CONCAT('/', "name") WHERE "fullPath" IS NULL;

-- Make fullPath required after setting values
ALTER TABLE "Location" ALTER COLUMN "fullPath" SET NOT NULL;

-- Add the foreign key relationship
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add indexes
CREATE INDEX "Location_parentId_idx" ON "Location"("parentId");
CREATE INDEX "Location_path_idx" ON "Location"("path");

-- Add unique constraint on fullPath
CREATE UNIQUE INDEX "Location_fullPath_key" ON "Location"("fullPath");

-- Remove the unique constraint on name since we now use fullPath
ALTER TABLE "Location" DROP CONSTRAINT IF EXISTS "Location_name_key";
