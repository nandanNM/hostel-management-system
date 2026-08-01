-- AlterTable
ALTER TABLE "daily_meal_activities" ADD COLUMN     "generated_by_id" TEXT;

-- CreateIndex
CREATE INDEX "daily_meal_activities_generated_by_id_idx" ON "daily_meal_activities"("generated_by_id");

-- AddForeignKey
ALTER TABLE "daily_meal_activities" ADD CONSTRAINT "daily_meal_activities_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
