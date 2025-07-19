import getSession from "@/lib/get-session";
import prisma from "@/lib/prisma";
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user.id)
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: session.user.id,
        read: false,
      },
    });
    return Response.json(notifications.length);
  } catch (error) {
    console.log(error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
