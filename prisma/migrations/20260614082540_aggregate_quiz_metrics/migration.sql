-- CreateTable
CREATE TABLE "QuizMetrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quizId" UUID NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "avgAccuracy" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgScore" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avgTimeTaken" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuizMetrics_quizId_key" ON "QuizMetrics"("quizId");

-- AddForeignKey
ALTER TABLE "QuizMetrics" ADD CONSTRAINT "QuizMetrics_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
