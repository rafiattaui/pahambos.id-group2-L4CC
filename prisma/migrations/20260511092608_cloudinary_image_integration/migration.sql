/*
  Warnings:

  - You are about to drop the column `image` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "imageKey" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "imageKey" TEXT,
ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "image",
ADD COLUMN     "imageKey" TEXT,
ADD COLUMN     "imageUrl" TEXT;
