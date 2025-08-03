import Link from "next/link"
import { ShieldX } from "lucide-react"

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

  const hideBackButtonRoutes = ["suspended", "inactive"]
  const shouldShowBackButton = !hideBackButtonRoutes.includes(route)
  const routeMessages: Record<string, { title: string; description: string }> =
    {
      suspended: {
        title: "Account Suspended",
        description:
          "Your account is suspended. Please contact admin for help.",
      },
      inactive: {
        title: "Access Restricted",
        description:
          "Hey! You're not a boarder, which means you cannot perform this action.",
      },
      banned: {
        title: "Access Denied",
        description:
          "You've been banned from accessing this section. Contact support if this is a mistake.",
      },
    }
  const message = routeMessages[route] ?? {
    title: "Unknown Status",
    description: "We couldn't determine your access level.",
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-destructive/10 mx-auto rounded-full p-4">
            <ShieldX className="text-destructive size-16" />
          </div>
          <CardTitle className="text-2xl">{message.title}</CardTitle>
          <CardDescription className="mx-auto max-w-xs">
            {message.description}
          </CardDescription>
        </CardHeader>
        {shouldShowBackButton && (
          <CardContent>
            <Link
              href="/"
              className={buttonVariants({
                className: "w-full",
              })}
            >
              Back to home
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
