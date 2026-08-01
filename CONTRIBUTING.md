# Contributing to HMS-PG1

This app runs a real hostel. A bad deploy means boarders can't toggle meals and
the manager can't generate the meal count for that slot — there is no "we'll fix
it tomorrow", because tomorrow's lunch already happened. So the rules below lean
towards caution.

---

## Getting set up

```bash
pnpm install              # postinstall generates the Prisma client
cp .env.example .env      # then fill in the values
pnpm db:generate          # regenerate the client after any schema change
pnpm dev
```

You need:

| Variable             | What it is                        |
| -------------------- | --------------------------------- |
| `DATABASE_URL`       | Postgres connection string (Neon) |
| `AUTH_GOOGLE_ID`     | Google OAuth client id            |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret        |

`src/lib/env.ts` validates these at import time, so a missing variable fails
loudly at boot rather than mysteriously at runtime.

> **There are two databases.** The dev branch and the production branch are
> different Neon endpoints. Before running anything that writes — a migration,
> a seed script, a manual query — check which host your `DATABASE_URL` points
> at.

---

## Before you push

```bash
pnpm verify
```

That runs the same four checks CI runs: `typecheck`, `lint`, `format:check`,
`test:run`. Individually:

| Command              | What it does                                     |
| -------------------- | ------------------------------------------------ |
| `pnpm typecheck`     | `tsc --noEmit`                                   |
| `pnpm lint`          | ESLint over the repo                             |
| `pnpm lint:fix`      | …and fix what it can                             |
| `pnpm format:write`  | Prettier (import sorting + Tailwind class order) |
| `pnpm test`          | Vitest in watch mode                             |
| `pnpm test:run`      | Vitest once                                      |
| `pnpm test:coverage` | Vitest with a coverage report                    |

Git hooks help but do not replace this:

- **pre-commit** — `lint-staged` formats the files you staged.
- **pre-push** — `typecheck` and `test:run`, so broken types never reach a PR.

---

## What CI checks

Every push to any branch and every PR into `main` runs
[`.github/workflows/ci.yml`](.github/workflows/ci.yml):

| Job               | What it protects                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Typecheck**     | `tsc --noEmit`                                                                                                        |
| **Lint**          | ESLint                                                                                                                |
| **Format**        | Prettier — fails if a file isn't formatted                                                                            |
| **Test**          | Vitest, run three times: `TZ=UTC`, `TZ=Asia/Kolkata`, `TZ=America/New_York`                                           |
| **Prisma schema** | Schema is valid and formatted, every migration applies from scratch against a throwaway Postgres, and no schema drift |
| **Build**         | `next build`, only after the cheap checks pass                                                                        |
| **CI**            | The single gate — point branch protection at this one job                                                             |

Two deliberate choices:

- CI never touches a real database. The Prisma job spins up a disposable
  `postgres:16` service container. Never put a Neon URL in Actions secrets for
  this.
- CI runs `next build`, **not** `pnpm build` — the latter runs
  `prisma migrate deploy` first, which must only ever happen from a deploy.

To make the pipeline mandatory: **Settings → Branches → protect `main` →
require the `CI` status check**.

---

## Conventions that matter here

### 1. Dates are always India time

The server runs in UTC on Vercel; the hostel does not. A boarder in Kolkata
picking "22 April" sends `2004-04-21T18:30:00Z`, and a naive
`format()`/`startOfDay()`/`getDate()` on the server renders or queries the
**21st**. This has bitten us in date of birth and in activity logs.

Everything goes through [`src/lib/date.ts`](src/lib/date.ts), which draws one
distinction you must respect:

- **Real instants** — `timestamp`, `createdAt`, `approvedAt`. Bound these with
  `istStartOfDay()` / `istEndOfDay()` / `istStartOfDaysAgo()`.
- **Day-key columns** — `daily_meal_activities.meal_date`, `guest_meals.date`,
  `meal_attendances.date`, `audit.date`. These store _UTC midnight of the India
  day_. Use `istCalendarDay()` / `istCalendarDayEnd()` /
  `istCalendarMonthStart()` / `istCalendarMonthEnd()`.

Mixing the two silently returns the wrong rows: a day-key bound on a timestamp
column starts the window at 05:30 IST. Use `formatIST()` for anything a person
reads, and `istDateOnly()` for a date the user picked in a calendar.

Never write the output of `istWallClock()` to the database or pass it to a
Prisma filter — it is a display-only fake instant.

`src/lib/date.test.ts` pins the day-key values to what production already
stores. **If that suite fails, existing rows have stopped matching new
queries** — treat it as data corruption, not a broken test.

### 2. Colours come from theme tokens

Use `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`,
`border`. A hardcoded `bg-white` or `text-gray-800` looks fine until someone
switches to dark mode and gets a white slab. Check both themes before opening
the PR.

### 3. URL state goes through nuqs

Filters, pagination and date ranges live in the URL via `useQueryState` /
`useQueryStates`. When a **server** component reads the param, pass
`{ shallow: false }` — otherwise the URL changes and the server never
re-renders.

### 4. Schema changes ship with a migration

```bash
pnpm exec prisma migrate dev --name what_you_changed
```

Commit the generated folder under `prisma/migrations/`. CI fails if
`schema.prisma` has changes with no matching migration. Never hand-edit an
applied migration; add a new one.

### 5. Authorization is checked server-side

Hiding a button is not access control. Every route handler and server action
guards with `canManage()` / `isManager()` / `requireUser()` /
`requireMessPrefect()` before it touches data.

---

## Tests

Vitest, `environment: "node"`, files named `*.test.ts` next to the code they
cover. The suite is pinned to `TZ=UTC` locally and re-run under three zones in
CI.

Worth testing: date and time logic, billing arithmetic, meal-count derivation,
authorization helpers, anything with a boundary condition. Not worth testing:
JSX that only arranges other components.

When you fix a bug, add the failing case first. Every test in
`src/lib/date.test.ts` exists because something was once wrong in production.

---

## Branches, commits, PRs

Branch from `main`:

```
fix/<what>        feat/<what>        chore/<what>        refactor/<what>
```

Conventional commits, subject in the imperative and under ~72 characters:

```
fix(dates): make every calendar decision India-time, not server-time
feat(billing): let the prefect adjust a finalised month
```

If the _why_ isn't obvious from the subject, put it in the body. Future you
will be reading it during an incident.

Open the PR against `main`, fill in the template, wait for the `CI` gate.
Anything that touches money, meal counts, or migrations deserves a second pair
of eyes.

---

## If you break production

1. **Revert first, diagnose second.** `git revert <sha>`, push, let it deploy.
2. Meal count for the current slot wrong? Check `daily_meal_activities` for
   today's day-key before regenerating — the unique constraint on
   `[mealTime, createdAt]` will not save you from a duplicate row.
3. Write the regression test before the fix.
