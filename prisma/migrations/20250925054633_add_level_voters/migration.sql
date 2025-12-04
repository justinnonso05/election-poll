/*
  Warnings:

  - Added the required column `level` to the `Voter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Voter" ADD COLUMN     "level" TEXT NOT NULL;
