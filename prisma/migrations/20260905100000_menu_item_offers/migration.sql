-- Which food a day actually provides used to be guessed from the scheduled
-- dish's *name*. Any dish whose name carried no keyword - "Roti", "Dim curry",
-- "Kosha mangsho" - matched nothing, so the day resolved to no offering and
-- every non-veg boarder was counted vegetarian. On this hostel's Friday roti
-- dinner that mis-counted all 27 boarders, every week since July.
--
-- The prefect now ticks per dish what can be served that day, and the
-- fallback walks only those.

ALTER TABLE "menu_items" ADD COLUMN "offers" "NonVegType"[] NOT NULL DEFAULT ARRAY[]::"NonVegType"[];

-- Backfill so nothing changes meaning on nights that were already correct.
-- Each tier offers itself and everything leaner, which is what the old
-- priority chain did implicitly. The prefect can narrow these - unticking
-- Fish on the Chicken dish stops the count asking for fish on a chicken night.
UPDATE "menu_items" SET "offers" = ARRAY['MUTTON','CHICKEN','FISH','EGG']::"NonVegType"[] WHERE LOWER("name") LIKE '%mutton%';
UPDATE "menu_items" SET "offers" = ARRAY['CHICKEN','FISH','EGG']::"NonVegType"[]          WHERE "offers" = '{}' AND LOWER("name") LIKE '%chicken%';
UPDATE "menu_items" SET "offers" = ARRAY['FISH','EGG']::"NonVegType"[]                    WHERE "offers" = '{}' AND LOWER("name") LIKE '%fish%';
UPDATE "menu_items" SET "offers" = ARRAY['EGG']::"NonVegType"[]                           WHERE "offers" = '{}' AND LOWER("name") LIKE '%egg%';
-- A dish named for veg is a real veg day: it stays empty.
-- Everything else is a dish the old code could not read at all (Roti). It is
-- demonstrably not a veg day, so it gets the ordinary non-veg spread and
-- shows up in the UI for the prefect to narrow.
UPDATE "menu_items" SET "offers" = ARRAY['CHICKEN','FISH','EGG']::"NonVegType"[]
  WHERE "offers" = '{}' AND LOWER("name") NOT LIKE '%veg%';

-- Mutton was in the priority chain and pickable at onboarding but had no
-- counter: on a mutton night its boarders were added to total_veg and
-- appeared in no drill-down list.
ALTER TABLE "daily_meal_activities" ADD COLUMN "total_nonveg_mutton" INTEGER NOT NULL DEFAULT 0;

-- Snapshot of what was on offer, so a later menu edit cannot rewrite history.
ALTER TABLE "daily_meal_activities" ADD COLUMN "offered_types" "NonVegType"[] NOT NULL DEFAULT ARRAY[]::"NonVegType"[];
