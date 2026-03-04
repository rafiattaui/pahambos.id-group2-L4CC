/*
  Warnings:

  - You are about to drop the column `questionData` on the `QuizQuestion` table. All the data in the column will be lost.
  - Added the required column `correctAnswer` to the `QuizQuestion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `QuizQuestion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuizQuestion" DROP COLUMN "questionData",
ADD COLUMN     "answers" TEXT[],
ADD COLUMN     "correctAnswer" INTEGER NOT NULL,
ADD COLUMN     "question" TEXT NOT NULL;
