-- DropForeignKey
ALTER TABLE "public"."Candidate" DROP CONSTRAINT "Candidate_electionId_fkey";

-- AlterTable
ALTER TABLE "public"."Candidate" ALTER COLUMN "photoUrl" SET DEFAULT 'https://res.cloudinary.com/dpyxbvcyl/image/upload/v1759396141/UNDECIDED_qsubo3.png';

-- AddForeignKey
ALTER TABLE "public"."Candidate" ADD CONSTRAINT "Candidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "public"."Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
