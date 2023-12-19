-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "isAuthenticated" BOOLEAN NOT NULL DEFAULT false;
