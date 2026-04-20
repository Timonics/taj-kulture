/*
  Warnings:

  - You are about to drop the column `images` on the `Review` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "images",
ADD COLUMN     "audioUrl" TEXT;
