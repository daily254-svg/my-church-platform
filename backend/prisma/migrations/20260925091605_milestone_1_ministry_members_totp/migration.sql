/*
  Warnings:

  - A unique constraint covering the columns `[churchId,name]` on the table `MinistryGroup` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `churchId` to the `Announcement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `churchId` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `churchId` to the `FeedPost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `churchId` to the `Giving` table without a default value. This is not possible if the table is not empty.
  - Added the required column `churchId` to the `LiveService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `churchId` to the `MinistryGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `churchId` to the `Prayer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `churchId` to the `Sermon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "UserStatus" ADD VALUE 'REJECTED';

-- DropIndex
DROP INDEX "MinistryGroup_name_key";

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "churchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "churchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "FeedPost" ADD COLUMN     "churchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Giving" ADD COLUMN     "churchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LiveService" ADD COLUMN     "churchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MinistryGroup" ADD COLUMN     "churchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Prayer" ADD COLUMN     "churchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sermon" ADD COLUMN     "churchId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpSecret" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MinistryGroup_churchId_name_key" ON "MinistryGroup"("churchId", "name");

-- AddForeignKey
ALTER TABLE "MinistryGroup" ADD CONSTRAINT "MinistryGroup_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveService" ADD CONSTRAINT "LiveService_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sermon" ADD CONSTRAINT "Sermon_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Giving" ADD CONSTRAINT "Giving_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prayer" ADD CONSTRAINT "Prayer_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
