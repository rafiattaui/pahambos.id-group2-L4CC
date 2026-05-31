/*
  Warnings:

  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - Added the required column `role` to the `UserClassroom` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserClassroom" ADD COLUMN     "role" "Role" NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role";
