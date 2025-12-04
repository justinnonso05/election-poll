/*
  Warnings:

  - A unique constraint covering the columns `[electionId,positionId,name]` on the table `Candidate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[voterId,electionId,candidateId]` on the table `Vote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `positionId` to the `Candidate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Vote_voterId_electionId_key";

-- AlterTable
ALTER TABLE "public"."Candidate" ADD COLUMN     "positionId" TEXT NOT NULL,
ALTER COLUMN "photoUrl" SET DEFAULT 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop&crop=face';

-- CreateTable
CREATE TABLE "public"."Position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "maxCandidates" INTEGER NOT NULL DEFAULT 10,
    "associationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_name_associationId_key" ON "public"."Position"("name", "associationId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_electionId_positionId_name_key" ON "public"."Candidate"("electionId", "positionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_voterId_electionId_candidateId_key" ON "public"."Vote"("voterId", "electionId", "candidateId");

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "public"."Association"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Candidate" ADD CONSTRAINT "Candidate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
