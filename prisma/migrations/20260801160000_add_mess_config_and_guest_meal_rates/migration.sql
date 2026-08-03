-- CreateTable
CREATE TABLE "mess_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "non_veg_priority" "NonVegType"[],
    "guest_booking_max_days_ahead" INTEGER NOT NULL DEFAULT 7,
    "guest_booking_cutoff_minutes" INTEGER NOT NULL DEFAULT 120,
    "lunch_start_minute" INTEGER NOT NULL DEFAULT 750,
    "dinner_start_minute" INTEGER NOT NULL DEFAULT 1230,
    "guest_meal_fallback_charge" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "max_guests_per_booking" INTEGER NOT NULL DEFAULT 5,
    "max_guest_meals_per_user_per_month" INTEGER NOT NULL DEFAULT 20,
    "meal_preference_lock_minutes" INTEGER NOT NULL DEFAULT 120,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" TEXT,

    CONSTRAINT "mess_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_meal_rates" (
    "id" TEXT NOT NULL,
    "meal_time" "MealTimeType" NOT NULL,
    "type" "MealType" NOT NULL,
    "non_veg_type" "NonVegType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_meal_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_meal_rates_meal_time_type_non_veg_type_key" ON "guest_meal_rates"("meal_time", "type", "non_veg_type");

-- AddForeignKey
ALTER TABLE "mess_config" ADD CONSTRAINT "mess_config_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
