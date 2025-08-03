import { format } from "date-fns"
import { Calendar, InfoIcon } from "lucide-react"

import { GuestRequestsList } from "./_components/guest-requests-list"
import { MealDataCard } from "./_components/meal-data-card"
import { MessagesList } from "./_components/messages-list"

export default function Page() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="rounded-md border border-amber-500/50 px-4 py-3 text-amber-600">
        <p className="text-sm">
          <InfoIcon
            className="me-3 -mt-0.5 inline-flex"
            size={16}
            aria-hidden="true"
          />
          Once you generate today&apos;s meal record, it cannot be undone or
          edited. Please double-check all meal messages and guest request
          details before proceeding.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage today&apos;s meal operations and oversee guest requests
          </p>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4" />
          {format(new Date(), "EEEE, MMMM do, yyyy")}
        </div>
      </div>

      {/* Meal Data Generation */}
      <MealDataCard />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Recipes */}
        {/* <RecipesList recipes={todayRecipes} /> */}

        {/* Meal Messages */}
        <MessagesList />
      </div>

      {/* Pending Guest Meal Requests */}
      <GuestRequestsList />
    </div>
  )
}
