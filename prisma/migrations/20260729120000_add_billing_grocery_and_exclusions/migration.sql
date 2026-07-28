-- AlterTable
ALTER TABLE "audits" ADD COLUMN     "grocery_expenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "excluded_user_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
