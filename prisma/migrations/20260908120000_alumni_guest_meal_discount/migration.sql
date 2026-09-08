-- Guest meals booked for an alumnus get a configurable discount per meal, and
-- every log and card marks them as alumni bookings.
--
-- The alumnus is recorded by id rather than inferred from the guest name: two
-- people can share a name, and a booking whose charge is lower has to be able
-- to say why. RESTRICT, like the approver relation, so the directory row
-- cannot be deleted out from under a booking that names it.
ALTER TABLE "guest_meals" ADD COLUMN "alumni_id" TEXT;

ALTER TABLE "guest_meals" ADD CONSTRAINT "guest_meals_alumni_id_fkey"
  FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing bookings predate the discount, so they stay plain guest meals.
CREATE INDEX "guest_meals_alumni_id_idx" ON "guest_meals"("alumni_id");

-- What comes off one alumni meal. The prefect changes this in Mess Config;
-- 0 turns the discount off without touching the booking form.
ALTER TABLE "mess_config" ADD COLUMN "guest_meal_alumni_discount" DOUBLE PRECISION NOT NULL DEFAULT 5;
