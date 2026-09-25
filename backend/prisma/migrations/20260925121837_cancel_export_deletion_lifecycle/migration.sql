-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_churchId_fkey";

-- AlterTable
ALTER TABLE "Church" ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
