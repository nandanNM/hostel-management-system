import { CheckIcon, XIcon } from "lucide-react"

import type { GetUsersWithMeal } from "@/types/prisma.type"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ResidentAttendanceTableProps = {
  allResidents: GetUsersWithMeal[] | undefined // All possible residents
  selectedDateAttendance: {
    lunch: GetUsersWithMeal[]
    dinner: GetUsersWithMeal[]
  }
  isLoading: boolean
}

export function ResidentAttendanceTable({
  allResidents,
  selectedDateAttendance,
  isLoading,
}: ResidentAttendanceTableProps) {
  if (isLoading) {
    return (
      <div className="text-muted-foreground py-4 text-center">
        Loading residents...
      </div>
    )
  }

  if (!allResidents || allResidents.length === 0) {
    return (
      <div className="text-muted-foreground py-4 text-center">
        No residents found.
      </div>
    )
  }

  const lunchPresentIds = new Set(selectedDateAttendance.lunch.map((r) => r.id))
  const dinnerPresentIds = new Set(
    selectedDateAttendance.dinner.map((r) => r.id)
  )

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Resident Name</TableHead>
            <TableHead>Room</TableHead>
            <TableHead className="text-center">Lunch</TableHead>
            <TableHead className="text-center">Dinner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allResidents.map((resident) => (
            <TableRow key={resident.id}>
              <TableCell className="font-medium">{resident.name}</TableCell>
              <TableCell>{resident.id}</TableCell>
              <TableCell className="text-center">
                {lunchPresentIds.has(resident.id) ? (
                  <CheckIcon className="mx-auto h-4 w-4 text-green-500" />
                ) : (
                  <XIcon className="mx-auto h-4 w-4 text-red-500" />
                )}
              </TableCell>
              <TableCell className="text-center">
                {dinnerPresentIds.has(resident.id) ? (
                  <CheckIcon className="mx-auto h-4 w-4 text-green-500" />
                ) : (
                  <XIcon className="mx-auto h-4 w-4 text-red-500" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
