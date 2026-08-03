## What changed

<!-- One or two sentences. What does this PR do, from a boarder's or manager's
point of view? -->

## Why

<!-- The problem being solved. Link the issue if there is one. -->

## How to verify

<!-- The steps a reviewer should take. "Log in as a manager, open Activity
Logs, pick Today" beats "tested locally". -->

## Checklist

- [ ] `pnpm verify` passes locally (typecheck, lint, format, tests)
- [ ] Any date or time logic goes through `src/lib/date.ts` (India time, never
      the server's timezone)
- [ ] Schema changes ship with a migration (`prisma migrate dev`)
- [ ] New UI uses theme tokens (`bg-card`, `text-muted-foreground`, …) and was
      checked in both light and dark mode
- [ ] No secrets, tokens, or real boarder data in the diff

## Screenshots

<!-- For UI changes, light and dark mode. -->
