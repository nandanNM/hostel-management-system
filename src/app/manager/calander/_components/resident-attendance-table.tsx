"use client"

import { useMemo, useState } from "react"
import { CheckIcon, XIcon } from "lucide-react"

import type { GetUsersWithMeal } from "@/types/prisma.type" // Assuming this type has 'id', 'name', and 'email'

import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import UserAvatar from "@/components/UserAvatar"

type ResidentAttendanceTableProps = {
  allResidents: GetUsersWithMeal[] | undefined // All possible residents
  selectedDateAttendance: {
    lunch: GetUsersWithMeal[]
    dinner: GetUsersWithMeal[]
  }
  isLoading: boolean
}

const ITEMS_PER_PAGE = 5 // Default to show 5 users per page

export function ResidentAttendanceTable({
  allResidents,
  selectedDateAttendance,
  isLoading,
}: ResidentAttendanceTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const lunchPresentIds = new Set(
    selectedDateAttendance.lunch.map((r) => r.email)
  ) // Corrected to use r.email
  const dinnerPresentIds = new Set(
    selectedDateAttendance.dinner.map((r) => r.id)
  )

  const filteredResidents = useMemo(() => {
    if (!allResidents) return []
    if (!searchQuery) return allResidents
    if (!searchQuery) {
      return allResidents
    }
    const lowerCaseQuery = searchQuery.toLowerCase()
    return allResidents.filter(
      (resident) =>
        (resident.name?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
        resident.id.toLowerCase().includes(lowerCaseQuery)
    )
  }, [allResidents, searchQuery])

  const totalPages = Math.ceil(filteredResidents.length / ITEMS_PER_PAGE)
  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredResidents.slice(startIndex, endIndex)
  }, [currentPage, filteredResidents])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-4 text-center">
        Loading residents...
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 max-w-sm">
        <Input
          type="text"
          placeholder="Search residents by name or email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setCurrentPage(1)
          }}
          className="max-w-sm"
          aria-label="Search residents"
        />
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resident</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-center">Lunch</TableHead>
              <TableHead className="text-center">Dinner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResidents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground h-24 text-center"
                >
                  No residents found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedResidents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="flex items-center space-x-3">
                    <UserAvatar avatarUrl={resident.image} size={38} />
                    <div>
                      <div className="font-medium">
                        {resident.name || "Unknown User"}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {resident.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {resident.meals.map((m, idx) => (
                      <span
                        key={idx}
                        className="bg-muted text-muted-foreground rounded-full border px-2 py-0.5 text-xs"
                      >
                        {m.type}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell className="text-center">
                    {lunchPresentIds.has(resident.email) ? (
                      <CheckIcon
                        className="mx-auto h-4 w-4 text-green-500"
                        aria-label="Present for lunch"
                      />
                    ) : (
                      <XIcon
                        className="mx-auto h-4 w-4 text-red-500"
                        aria-label="Absent for lunch"
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {dinnerPresentIds.has(resident.id) ? (
                      <CheckIcon
                        className="mx-auto h-4 w-4 text-green-500"
                        aria-label="Present for dinner"
                      />
                    ) : (
                      <XIcon
                        className="mx-auto h-4 w-4 text-red-500"
                        aria-label="Absent for dinner"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={() => handlePageChange(currentPage - 1)}
                aria-disabled={currentPage === 1}
                tabIndex={currentPage === 1 ? -1 : undefined}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === currentPage}
                  onClick={() => handlePageChange(page)}
                  aria-label={`Go to page ${page}`}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={() => handlePageChange(currentPage + 1)}
                aria-disabled={currentPage === totalPages}
                tabIndex={currentPage === totalPages ? -1 : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
