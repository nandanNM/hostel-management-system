import { Metadata } from "next"
import { InfoIcon } from "lucide-react"

export const metadata: Metadata = {
  title: "Admin Dashboard",
}

export default async function Page() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="bg-primary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-full">
        <InfoIcon className="text-primary h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="text-muted-foreground mt-4 max-w-sm text-lg leading-relaxed">
        The full administrator implementation is currently under maintenance. We
        are working on bringing you advanced analytics and user management tools.
      </p>
      <div className="mt-8 rounded-lg border border-blue-500/20 bg-blue-50/50 p-4 dark:bg-blue-900/10">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Estimated completion: Coming Soon
        </p>
      </div>
    </div>
  )
}
