import { NextResponse } from "next/server"

import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const hostels = await prisma.hostel.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        address: true,
      },
    })
    return NextResponse.json(hostels)
  } catch (error) {
    console.error("[HOSTELS_GET_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
