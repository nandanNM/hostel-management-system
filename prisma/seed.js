import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const menuItems = [
    { name: "VEG", costPerUnit: 45 },
    { name: "EGG", costPerUnit: 50 },
    { name: "FISH", costPerUnit: 55 },
    { name: "CHICKEN", costPerUnit: 60 },
    { name: "MUTTON", costPerUnit: 120 },
  ]

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: { costPerUnit: item.costPerUnit },
      create: item,
    })
  }

  console.log("✅ Menu items seeded successfully.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
