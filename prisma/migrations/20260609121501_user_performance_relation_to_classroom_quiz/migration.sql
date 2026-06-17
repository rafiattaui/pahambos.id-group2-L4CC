-- AlterTable
ALTER TABLE "UserPerformance" ADD COLUMN     "classroomQuizId" UUID;

-- AddForeignKey
ALTER TABLE "UserPerformance" ADD CONSTRAINT "UserPerformance_classroomQuizId_fkey" FOREIGN KEY ("classroomQuizId") REFERENCES "ClassroomQuiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
