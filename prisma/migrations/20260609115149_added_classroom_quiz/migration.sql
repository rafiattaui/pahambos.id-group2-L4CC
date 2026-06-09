-- CreateTable
CREATE TABLE "ClassroomQuiz" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "classroomId" UUID NOT NULL,
    "quizId" UUID NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassroomQuiz_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClassroomQuiz" ADD CONSTRAINT "ClassroomQuiz_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassroomQuiz" ADD CONSTRAINT "ClassroomQuiz_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
