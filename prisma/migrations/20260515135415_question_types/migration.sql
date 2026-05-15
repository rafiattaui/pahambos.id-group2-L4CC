/*
  Warnings:

  - The `correctAnswer` column on the `QuizQuestion` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SingleSelect', 'MultiSelect');

-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'SingleSelect',
DROP COLUMN "correctAnswer",
ADD COLUMN     "correctAnswer" INTEGER[];
