import { format } from "date-fns"
import { Calendar } from "lucide-react"

import { GuestRequestsList } from "./_components/guest-requests-list"
import { MealDataCard } from "./_components/meal-data-card"
import { MessagesList } from "./_components/messages-list"

export default function Page() {
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
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
