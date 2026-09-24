-- AlterEnum
ALTER TYPE "ArticleCategory" ADD VALUE 'REAL_WEDDING';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "vendorSlugs" TEXT[];

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "overtimeNote" TEXT;
