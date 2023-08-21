/*
  Warnings:

  - You are about to drop the `urls` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "urls";

-- CreateTable
CREATE TABLE "Url" (
    "id" TEXT NOT NULL,
    "jwtString" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Url_pkey" PRIMARY KEY ("id")
);
