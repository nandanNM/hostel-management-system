import { P, paragraphVariants } from "@/components/custom/p";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

import { RiGoogleFill } from "@remixicon/react";

import { signIn } from "@/auth";

interface Props {
  action: "Sign In" | "Sign Up";
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
            "use server";
            await signIn("google", {
              callbackUrl: "/",
            });
          }}
        >
          <Button variant="lift">
            <RiGoogleFill /> {action} with google
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
              <Link href="/sign-in" className="link">
                Sign In
              </Link>
            </>
          )}
        </P>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
