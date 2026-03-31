import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { GalleryVerticalEnd } from "lucide-react"
import Image from "next/image"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (session) {
    if (session.user.onboardingCompleted) redirect("/")
    redirect("/onboarding/identity")
  }
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col overflow-y-auto p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            PG-1 Hostel.
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <div className="mt-auto w-full pt-6">
          <div className="text-muted-foreground flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-medium md:justify-start">
            <a
              href="https://codernandan.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Built by{" "}
              <span className="text-foreground border-b border-muted-foreground/30 font-bold">
                codernandan
              </span>{" "}
              💖
            </a>
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/pg1.png"
          alt="Pg1 Hostel"
          fill
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </main>
  )
}
