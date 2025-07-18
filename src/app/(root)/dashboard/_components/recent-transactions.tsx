import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compareDesc, format } from "date-fns";
import { P } from "@/components/custom/p";
import prisma from "@/lib/prisma";
import { BillEntryType } from "@/generated/prisma";
interface RecentTransactionsProps {
  userId: string;
}
export default async function RecentTransactions({
  userId,
}: RecentTransactionsProps) {
  const transactions = await prisma.userBill.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      issueDate: "desc",
    },
    take: 5,
    include: {
      fine: {
        select: {
          reason: true,
          status: true,
        },
      },
      guestMeal: {
        select: {
          numberOfMeals: true,
          mealTime: true,
        },
      },
      audit: {
        select: {
          date: true,
        },
      },
      payment: {
        select: {
          paidAmount: true,
        },
      },
    },
  });
  if (!transactions.length) {
    return <P className="text-center">No recent transactions found .</P>;
  }

  const formattedTransactions = transactions.map((transaction) => {
    let statusText = "";
    let badgeClass = "";
    if (
      transaction.type === BillEntryType.PAYMENT ||
      transaction.type === BillEntryType.ADJUSTMENT_CREDIT
    ) {
      statusText = "Completed";
    } else {
      statusText = transaction.isPaid ? "Paid" : "Outstanding";
    }

    let detail = transaction.description;
    if (
      transaction.type === BillEntryType.FINE_CHARGE &&
      transaction.fine?.reason
    ) {
      detail = `Fine: ${transaction.fine.reason}`;
      statusText = transaction.fine.status;
    } else if (
      transaction.type === BillEntryType.GUEST_MEAL_CHARGE &&
      transaction.guestMeal
    ) {
      detail = `Guest Meal (${transaction.guestMeal.numberOfMeals} meals, ${transaction.guestMeal.mealTime})`;
    } else if (
      transaction.type === BillEntryType.MEAL_CHARGE &&
      transaction.audit?.date
    ) {
      detail = `Monthly Meal Charge for ${format(new Date(transaction.audit.date), "MMMM yyyy")}`;
    }
    switch (transaction.type) {
      case "PAYMENT":
        badgeClass = "bg-green-100 text-green-800 hover:bg-green-200";
        break;
      case "GUEST_MEAL_CHARGE":
        badgeClass = "bg-red-100 text-red-800 hover:bg-red-200";
        break;
      case "FINE_CHARGE":
        badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-200";
        break;
      case "MEAL_CHARGE":
        badgeClass = "bg-blue-100 text-blue-800 hover:bg-blue-200";
        break;
      default:
        badgeClass = "bg-gray-100 text-gray-800 hover:bg-gray-200";
        break;
    }
    return {
      id: transaction.id,
      date: format(transaction.issueDate, "dd/MM/yyyy"),
      type: transaction.type.replace(/_/g, " "),
      description: detail,
      amount: transaction.amount,
      balanceRemaining: transaction.balanceRemaining,
      status: statusText,
      badgeClass,
    };
  });

  const sortedRecentTransactions = formattedTransactions.sort((a, b) =>
    compareDesc(a.date, b.date),
  );
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-xl">Recent Transactions</CardTitle>
        <CardDescription className="text-gray-500">
          Your latest meal and payment history
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="text-right font-semibold">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRecentTransactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="transition-colors hover:bg-gray-50/50"
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
                  className={`text-right font-bold ${transaction.amount > 0 ? "text-red-600" : "text-green-600"}`}
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
  );
}
