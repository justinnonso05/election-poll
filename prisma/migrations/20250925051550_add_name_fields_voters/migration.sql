/*
  Warnings:

  - You are about to drop the column `name` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Voter` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `Voter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `Voter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Voter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Voter" DROP COLUMN "name",
DROP COLUMN "passwordHash",
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "last_name" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL;
