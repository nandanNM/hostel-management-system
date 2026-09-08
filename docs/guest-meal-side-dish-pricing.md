# Side dishes and the guest tier rate card

**Status:** not implemented — future work.
**Raised:** 8 Sep 2026, while adding tier pricing for guest meals.

## Background

Guest meal pricing reads the dish library as a **tier rate card**. Each dish's
_headline tier_ is the richest thing it offers, and the cheapest dish with that
headline sets the tier's rate — see `resolveTierPrices()` in
[`src/lib/guest-meal-rules.ts`](../src/lib/guest-meal-rules.ts).

With the standard library that gives:

| Dish    | offers                        | headline | sets |
| ------- | ----------------------------- | -------- | ---- |
| Mutton  | mutton → chicken → fish → egg | MUTTON   | ₹130 |
| Chicken | chicken → fish → egg          | CHICKEN  | ₹60  |
| Roti    | chicken → egg                 | CHICKEN  | ₹60  |
| Fish    | fish → egg                    | FISH     | ₹55  |
| Egg     | egg                           | EGG      | ₹50  |
| Veg     | —                             | VEG      | ₹45  |

A guest is charged for the tier they booked, so a Roti night bills chicken at
₹60 and egg at ₹50, and Roti's own ₹60 never reaches an egg guest.

## The problem

A night can schedule a **side** alongside the main plate — Roti _and_ kheer.
A side is a dish like any other in the library, and a sweet has no offers
ticked, so its headline tier is `VEG`: the same slot the Veg plate occupies.

Because the cheaper dish wins a shared tier, adding Kheer at ₹20 does not just
change roti day:

| Night                     | veg rate before | after adding Kheer ₹20 |
| ------------------------- | --------------- | ---------------------- |
| Fri dinner — Roti + Kheer | ₹45             | ₹20                    |
| Tue dinner — Egg          | ₹45             | ₹20                    |
| Sun dinner — Veg          | ₹45             | ₹20                    |

A dessert ends up deciding what a veg plate costs, on every night of the week.
Flipping the tie-break to dearest-wins does not fix it either — an ₹80 kheer
would then push veg to ₹80 everywhere. Neither rule is right: the library
cannot tell a **main plate** from a **side**, and `offers = []` means both
"veg plate" and "sweet".

The second half of the problem: a guest on that night eats the roti _and_ the
kheer, but the tier rate only covers the plate, so nobody pays for the kheer.

### Blast radius

Pricing only. A side contributes no offers, so `resolveOffers()` is unchanged
and meal counts, the bookable tier list and the menu label ("Roti, Kheer") all
behave correctly today.

## Options considered

### A — price sides at ₹0 (works today, no code)

Both `resolveTierPrices()` and the night fallback skip dishes priced at 0, and
the Add Dish form accepts 0 (number input, no minimum). A ₹0 Kheer is invisible
to guest pricing.

- The library stops recording what the side actually costs the mess.
- Guests eat it free.

Good as an immediate stopgap.

### B — a "side dish" flag on `MenuItem` (recommended)

One boolean, default `false`, surfaced as a checkbox beside the offer boxes in
the Menu Items Library. Sides never enter the tier rate card. Then choose what a
side does to the bill:

- **B1 — nothing.** The tier rate covers the plate; sides are on the house.
  Same outcome as A, but the real price stays recorded for the mess's own
  costing.
- **B2 — adds on top.** A Roti + Kheer night bills chicken 60 + 20 = **₹80**,
  egg 50 + 20 = **₹70**, veg 45 + 20 = **₹65**. Honest cost recovery, and still
  fully dynamic — schedule the kheer on another night and that night's guests
  pay for it too, with no code change.

**B2 is the recommendation:** one boolean column, one sum, and "per guest" in
the library stays truthful for every dish.

### C — pin every rate in the Mess Config grid

Fill all 10 rows (5 tiers × lunch/dinner) and no library dish can ever move a
guest price again, kheer included. No schema change.

- Stops being dynamic: every price change becomes a manual grid edit.
- The library's per-guest figures become decorative.

### D — infer the side from the data (rejected)

Guess by "cheapest dish that night", or "veg-only dish scheduled next to a
main". On a Veg + Kheer night nothing distinguishes the plate from the dessert,
so it would misprice the exact case that motivated it.

## Implementation sketch for B2

1. **Schema** — `MenuItem.isSide Boolean @default(false)`, plus a migration.
   Backfill is a no-op: every existing dish is a main.
2. **Library UI** — a checkbox in the Add/Edit Dish modal in
   [`meal-schedule-view.tsx`](../src/app/manager/settings/meal-scheduling/_components/meal-schedule-view.tsx),
   next to the offer boxes, and a "side" marker on the dish card. Pass it
   through `upsertMenuItem()`.
3. **Rate card** — `resolveTierPrices()` skips dishes where `isSide` is true, so
   a side can never set a tier.
4. **Per-night add-on** — a new helper (`resolveSideCharge()`) sums
   `costPerUnit` over the scheduled dishes that are sides;
   `buildGuestMealPricing()` adds that to every choice in the slot. It must land
   in the price map itself, not in the form, so the quote stays the charge by
   construction.
5. **Booking form** — no change needed. It reads the same map, so the add-on
   appears in the dropdown and the per-meal line automatically.
6. **Tests** — extend
   [`tests/lib/guest-meal-rules.test.ts`](../tests/lib/guest-meal-rules.test.ts):
   a side does not set the veg tier; a Roti + Kheer night bills plate + side for
   every tier; a side with no price adds nothing.

### Caveat to carry into the work

After B, `offers = []` no longer means "veg plate" — it means "veg plate **or**
side", and the checkbox becomes the only thing separating Veg from Kheer. It has
to be set correctly when a dish is created, so the Add Dish form should make the
distinction obvious rather than leaving it as an easily-missed extra box.
