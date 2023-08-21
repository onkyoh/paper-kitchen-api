-- CreateTable
CREATE TABLE "urls" (
    "id" TEXT NOT NULL,
    "jwtString" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "urls_pkey" PRIMARY KEY ("id")
);
