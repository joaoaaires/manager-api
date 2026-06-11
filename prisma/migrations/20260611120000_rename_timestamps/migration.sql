-- Rename timestamp columns to follow the createdAt/updatedAt convention
ALTER TABLE "User" RENAME COLUMN "createAt" TO "createdAt";
ALTER TABLE "User" RENAME COLUMN "updateAt" TO "updatedAt";
