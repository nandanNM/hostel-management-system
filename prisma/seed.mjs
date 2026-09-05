/**
 * Rebuild a usable dev database.
 *
 * Run against dev only — it refuses to touch a database that already holds
 * meaningful data, so it cannot be pointed at production by accident.
 *
 *   pnpm db:seed
 *
 * Staff are *promoted*, never created. Inserting a user row with a real email
 * and no linked OAuth account makes Google sign-in fail with
 * `OAuthAccountNotLinked` — the adapter refuses to attach a login to a
 * pre-existing account with a matching address, which is what stops anyone
 * claiming an account by knowing its email. So: sign in first, then run this
 * again and the account is promoted.
 *
 * Boarders are synthetic: dev does not need 53 people's phone numbers and
 * addresses, and it is their meal preferences that matter for the count. They
 * never sign in, so the linking problem does not apply to them.
 */
import { PrismaClient } from "../src/lib/generated/prisma/index.js"

const prisma = new PrismaClient()

const STAFF = [
  {
    name: "Nandan Manna",
    email: "nandan7602831377@gmail.com",
    role: "MANAGER",
  },
  {
    name: "MD JYOTI JINNA RAHAMAN",
    email: "mdjjr2004@gmail.com",
    role: "MANAGER",
  },
  { name: "Bikram Roy", email: "roybikram185@gmail.com", role: "MANAGER" },
  {
    name: "Suvadip Mahato",
    email: "mahatosuvadip20@gmail.com",
    role: "MESS_PREFECT",
  },
  { name: "Rik Sarkar", email: "rik2232005@gmail.com", role: "MESS_PREFECT" },
]

/**
 * Mirrors production's preference spread, scaled down. The awkward cases are
 * deliberate: someone who dislikes what is being served is the only way to
 * exercise the fallback chain.
 */
const BOARDERS = [
  { name: "Aarav Das", type: "NON_VEG", nonVegType: "CHICKEN", dislikes: [] },
  { name: "Bishal Roy", type: "NON_VEG", nonVegType: "CHICKEN", dislikes: [] },
  { name: "Chirag Sen", type: "NON_VEG", nonVegType: "CHICKEN", dislikes: [] },
  {
    name: "Dipanjan Pal",
    type: "NON_VEG",
    nonVegType: "CHICKEN",
    dislikes: [],
  },
  { name: "Eshan Ghosh", type: "NON_VEG", nonVegType: "CHICKEN", dislikes: [] },
  {
    name: "Farhan Ali",
    type: "NON_VEG",
    nonVegType: "FISH",
    dislikes: ["CHICKEN"],
  },
  {
    name: "Gopal Dutta",
    type: "NON_VEG",
    nonVegType: "FISH",
    dislikes: ["CHICKEN"],
  },
  {
    name: "Hiran Bose",
    type: "NON_VEG",
    nonVegType: "CHICKEN",
    dislikes: ["MUTTON"],
  },
  {
    name: "Ipsit Jana",
    type: "NON_VEG",
    nonVegType: "CHICKEN",
    dislikes: ["EGG"],
  },
  {
    name: "Jayanta Kar",
    type: "NON_VEG",
    nonVegType: "CHICKEN",
    dislikes: ["FISH"],
  },
  {
    name: "Kaustav Mitra",
    type: "NON_VEG",
    nonVegType: "CHICKEN",
    dislikes: ["FISH", "EGG"],
  },
  {
    name: "Lalit Saha",
    type: "NON_VEG",
    nonVegType: "EGG",
    dislikes: ["CHICKEN", "MUTTON", "FISH"],
  },
  { name: "Manas Barman", type: "VEG", nonVegType: "NONE", dislikes: [] },
]

/** Menu as production has it, with the tiers each dish can actually serve. */
const MENU = [
  { name: "Veg", costPerUnit: 45, offers: [] },
  { name: "Egg", costPerUnit: 50, offers: ["EGG"] },
  { name: "Fish", costPerUnit: 55, offers: ["FISH", "EGG"] },
  { name: "Chicken", costPerUnit: 60, offers: ["CHICKEN", "FISH", "EGG"] },
  {
    name: "Mutton",
    costPerUnit: 130,
    offers: ["MUTTON", "CHICKEN", "FISH", "EGG"],
  },
  // The dish that started it all: a bread the prefect assigns a tier to.
  { name: "Roti", costPerUnit: 60, offers: ["CHICKEN", "EGG"] },
]

const SCHEDULE = [
  ["MONDAY", "LUNCH", "Fish"],
  ["MONDAY", "DINNER", "Egg"],
  ["TUESDAY", "LUNCH", "Fish"],
  ["TUESDAY", "DINNER", "Egg"],
  ["WEDNESDAY", "LUNCH", "Veg"],
  ["WEDNESDAY", "DINNER", "Chicken"],
  ["THURSDAY", "LUNCH", "Fish"],
  ["THURSDAY", "DINNER", "Egg"],
  ["FRIDAY", "LUNCH", "Veg"],
  ["FRIDAY", "DINNER", "Roti"],
  ["SATURDAY", "LUNCH", "Fish"],
  ["SATURDAY", "DINNER", "Egg"],
  ["SUNDAY", "LUNCH", "Chicken"],
  ["SUNDAY", "DINNER", "Veg"],
]

async function main() {
  const host = (process.env.DATABASE_URL ?? "").match(/@([^/]+)/)?.[1] ?? "?"
  console.log(`Seeding ${host}`)

  // Refuse to run anywhere that already holds real records. Losing a dev
  // database is an afternoon; losing production is the hostel's billing.
  const [bills, attendance] = await Promise.all([
    prisma.userBill.count(),
    prisma.mealAttendance.count(),
  ])
  if (bills > 0 || attendance > 0) {
    console.error(
      `\nREFUSING TO SEED: this database already has ${bills} bills and ${attendance} attendance rows.\n` +
        `That does not look like an empty dev database. Check DATABASE_URL.`
    )
    process.exit(1)
  }

  let promoted = 0
  const awaitingSignIn = []
  for (const s of STAFF) {
    const existing = await prisma.user.findUnique({
      where: { email: s.email },
      select: { id: true },
    })
    if (!existing) {
      awaitingSignIn.push(s.email)
      continue
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: s.name,
        role: s.role,
        status: "ACTIVE",
        onboardingCompleted: true,
      },
    })
    promoted += 1
  }
  console.log(`  staff        ${promoted} promoted`)

  for (const [i, b] of BOARDERS.entries()) {
    const user = await prisma.user.upsert({
      // @dev.local can never receive real mail, so a stray send is harmless.
      where: { email: `boarder${i + 1}@dev.local` },
      update: {},
      create: {
        name: b.name,
        email: `boarder${i + 1}@dev.local`,
        role: "STUDENT",
        status: "ACTIVE",
        onboardingCompleted: true,
        roomNo: `A-${101 + i}`,
        joinDate: new Date("2024-08-01"),
      },
    })
    await prisma.meal.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        type: b.type,
        nonVegType: b.nonVegType,
        dislikedNonVegTypes: b.dislikes,
        status: "ACTIVE",
      },
    })
  }
  console.log(`  boarders     ${BOARDERS.length}`)

  for (const item of MENU) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: { costPerUnit: item.costPerUnit, offers: item.offers },
      create: item,
    })
  }
  console.log(`  menu items   ${MENU.length}`)

  for (const [dayOfWeek, mealTime, dish] of SCHEDULE) {
    const entry = await prisma.mealScheduleEntry.upsert({
      where: { dayOfWeek_mealTime: { dayOfWeek, mealTime } },
      update: {},
      create: { dayOfWeek, mealTime },
    })
    const menuItem = await prisma.menuItem.findUniqueOrThrow({
      where: { name: dish },
    })
    await prisma.menuItemOnMealScheduleEntry.upsert({
      where: {
        mealScheduleEntryId_menuItemId: {
          mealScheduleEntryId: entry.id,
          menuItemId: menuItem.id,
        },
      },
      update: {},
      create: { mealScheduleEntryId: entry.id, menuItemId: menuItem.id },
    })
  }
  console.log(`  schedule     ${SCHEDULE.length} slots`)

  await prisma.messConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      nonVegPriority: ["MUTTON", "CHICKEN", "FISH", "EGG", "NONE"],
    },
  })
  console.log("  mess config  1")

  if (awaitingSignIn.length > 0) {
    console.log(
      `\nNot yet signed in, so not promoted:\n` +
        awaitingSignIn.map((e) => `  - ${e}`).join("\n") +
        `\n\nSign in with Google at ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}` +
        `, then run 'pnpm db:seed' again to grant the role.`
    )
  } else {
    console.log("\nDone. Every staff account is signed in and promoted.")
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
