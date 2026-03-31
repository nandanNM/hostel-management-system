import Link from "next/link"
import { MessageCircle, ShieldX } from "lucide-react"

import { ADMIN_WHATSAPP_NUMBER } from "@/constants"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function StatusPage({
  params,
}: {
  params: Promise<{ route?: string | string[] }>
}) {
  const awaitParams = await params
  let route: string
  if (Array.isArray(awaitParams.route)) {
    route = awaitParams.route[0] || "unknown"
  } else if (typeof awaitParams.route === "string") {
    route = awaitParams.route
  } else {
    route = "unknown"
  }

  const routeMessages: Record<string, { title: string; description: string }> =
    {
      suspended: {
        title: "Account Suspended",
        description:
          "Your mess account has been suspended by the management. Please contact the administrator for any queries or to resume services.",
      },
      inactive: {
        title: "Registration Pending",
        description:
          "Thank you for completing your onboarding! Your account is currently inactive as it awaits administrator approval. This usually takes 24 hours.",
      },
      banned: {
        title: "Access Restricted",
        description:
          "Your access to the hostel management system has been restricted. Please contact support if you believe this is a mistake.",
      },
    }
    
  const message = routeMessages[route] ?? {
    title: "Access Restricted",
    description: "We couldn't determine your current access level. Please contact the hostel administrator for verification.",
  }

  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello Admin, I am a boarder and I have a query regarding my account status (${route}).`
  )}`

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full">
            <ShieldX className="text-destructive h-10 w-10" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">{message.title}</CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-xs text-base">
            {message.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: "lift",
              className: "w-full gap-2",
            })}
          >
            <MessageCircle className="h-5 w-5" />
            Message the Admin
          </a>
          
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            Back to Home
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
