import Link from "next/link"
import { signIn } from "@/auth"
import { RiGoogleFill } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { P, paragraphVariants } from "@/components/custom/p"

interface Props {
  action: "Sign In" | "Sign Up"
}

const AuthForm = ({ action }: Props) => {
  return (
    <Card className="w-96 drop-shadow-2xl">
      <CardHeader>
        <CardTitle
          className={paragraphVariants({ size: "large", weight: "bold" })}
        >
          {action}
        </CardTitle>
        <CardDescription>{action} to access your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          action={async () => {
            "use server"
            await signIn("google", {
              callbackUrl: "/",
            })
          }}
        >
          <Button className="w-full bg-[#DB4437] text-white after:flex-1 hover:bg-[#DB4437]/90">
            <span className="pointer-events-none me-2 flex-1">
              <RiGoogleFill
                className="opacity-60"
                size={16}
                aria-hidden="true"
              />
            </span>
            {action} with Google
          </Button>
        </form>

        <P
          variant="muted"
          size="small"
          weight="light"
          className="w-full text-center"
        >
          {action === "Sign In" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="link">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="link">
                Sign In
              </Link>
            </>
          )}
        </P>
      </CardContent>
    </Card>
  )
}

export default AuthForm
