import { compareDesc, format } from "date-fns"

import { BillEntryType } from "@/lib/generated/prisma"
import prisma from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { P } from "@/components/custom/p"

interface RecentTransactionsProps {
  userId: string
}

const getBadgeClass = (type: BillEntryType) => {
  switch (type) {
    case "PAYMENT":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
    case "GUEST_MEAL_CHARGE":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
    case "FINE_CHARGE":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
    case "MEAL_CHARGE":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
    default:
      return "bg-muted text-foreground"
  }
}

export default async function RecentTransactions({
  userId,
}: RecentTransactionsProps) {
  const transactions = await prisma.userBill.findMany({
    where: { userId },
    orderBy: { issueDate: "desc" },
    take: 5,
    include: {
      fine: { select: { reason: true, status: true } },
      guestMeal: { select: { numberOfMeals: true, mealTime: true } },
      audit: { select: { date: true } },
      payment: { select: { paidAmount: true } },
    },
  })

  if (!transactions.length) {
    return (
      <P className="text-muted-foreground text-center">
        No recent transactions found.
      </P>
    )
  }

  const formattedTransactions = transactions.map((transaction) => {
    let statusText = ""
    if (
      transaction.type === BillEntryType.PAYMENT ||
      transaction.type === BillEntryType.ADJUSTMENT_CREDIT
    ) {
      statusText = "Completed"
    } else {
      statusText = transaction.isPaid ? "Paid" : "Outstanding"
    }

    let detail = transaction.description
    if (
      transaction.type === BillEntryType.FINE_CHARGE &&
      transaction.fine?.reason
    ) {
      detail = `Fine: ${transaction.fine.reason}`
      statusText = transaction.fine.status
    } else if (
      transaction.type === BillEntryType.GUEST_MEAL_CHARGE &&
      transaction.guestMeal
    ) {
      detail = `Guest Meal (${transaction.guestMeal.numberOfMeals} meals, ${transaction.guestMeal.mealTime})`
    } else if (
      transaction.type === BillEntryType.MEAL_CHARGE &&
      transaction.audit?.date
    ) {
      detail = `Monthly Meal Charge for ${format(new Date(transaction.audit.date), "MMMM yyyy")}`
    }

    return {
      id: transaction.id,
      date: format(transaction.issueDate, "dd/MM/yyyy"),
      type: transaction.type.replace(/_/g, " "),
      description: detail,
      amount: transaction.amount,
      balanceRemaining: transaction.balanceRemaining,
      status: statusText,
      badgeClass: getBadgeClass(transaction.type),
    }
  })

  const sortedRecentTransactions = formattedTransactions.sort((a, b) =>
    compareDesc(a.date, b.date)
  )

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-foreground text-xl">
          Recent Transactions
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Your latest meal and payment history
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground font-semibold">
                Date
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Type
              </TableHead>
              <TableHead className="text-foreground font-semibold">
                Description
              </TableHead>
              <TableHead className="text-foreground text-right font-semibold">
                Amount
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecentTransactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="font-medium">
                  {transaction.date}
                </TableCell>
                <TableCell>
                  <Badge className={transaction.badgeClass}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell
                  className={`text-right font-bold ${
                    transaction.amount > 0
                      ? "text-destructive"
                      : "text-green-600 dark:text-green-300"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}₹
                  {Math.abs(transaction.amount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
