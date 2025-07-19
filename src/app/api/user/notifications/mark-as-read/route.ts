import getSession from "@/lib/get-session";
import prisma from "@/lib/prisma";
export async function PATCH() {
  try {
    const session = await getSession();
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.notification.updateMany({
      where: {
        recipientId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });
    return new Response();
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
