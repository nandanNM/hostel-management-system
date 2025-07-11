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
import { db } from "@/db";
import { fine, guestmeal, payment } from "@/db/schemas";
import { desc, eq } from "drizzle-orm";
import { compareDesc } from "date-fns";
import { P } from "@/components/custom/p";
interface RecentTransactionsProps {
  userId: string;
}
export default async function RecentTransactions({
  userId,
}: RecentTransactionsProps) {
  const userPayments = await db.query.payment.findMany({
    where: eq(payment.userId, userId),
    orderBy: [desc(payment.createdAt)],
    limit: 2,
    columns: {
      id: true,
      amount: true,
      createdAt: true,
    },
  });
  const userGuestMeals = await db.query.guestmeal.findMany({
    where: eq(guestmeal.userId, userId),
    orderBy: [desc(guestmeal.createdAt)],
    limit: 2,
    columns: {
      id: true,
      mealType: true,
      mealCharge: true,
      createdAt: true,
    },
  });
  const userFine = await db.query.fine.findMany({
    where: eq(fine.userId, userId),
    orderBy: [desc(fine.createdAt)],
    limit: 2,
    columns: {
      id: true,
      reason: true,
      amount: true,
      createdAt: true,
    },
  });

  const formattedPayments = userPayments.map((p) => ({
    id: p.id,
    date: p.createdAt,
    type: "Payment",
    amount: p.amount,
    description: `User Payment`,
  }));

  const formattedGuestMeals = userGuestMeals.map((g) => ({
    id: g.id,
    date: g.createdAt,
    type: "Guest Meal",
    amount: -g.mealCharge,
    description: `${g.mealType} - 1 Guest`,
  }));

  const formattedFines = userFine.map((f) => ({
    id: f.id,
    date: f.createdAt,
    type: "Fine",
    amount: -f.amount,
    description: f.reason,
  }));

  const recentTransactions = [
    ...formattedPayments,
    ...formattedGuestMeals,
    ...formattedFines,
  ];
  const sortedRecentTransactions = recentTransactions.sort((a, b) =>
    compareDesc(a.date, b.date),
  );
  if (!sortedRecentTransactions.length) {
    return <P className="text-center">No recent transactions found .</P>;
  }
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
                  <Badge
                    variant={
                      transaction.type === "Payment"
                        ? "default"
                        : transaction.type === "Guest Meal"
                          ? "destructive"
                          : "secondary"
                    }
                    className={
                      transaction.type === "Payment"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : transaction.type === "Guest Meal"
                          ? "bg-red-100 text-red-800 hover:bg-red-200"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    }
                  >
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell
                  className={`text-right font-bold ${transaction.amount > 0 ? "text-green-600" : transaction.amount < 0 ? "text-red-600" : "text-gray-600"}`}
                >
                  {transaction.amount > 0 ? "+" : ""}₹
                  {Math.abs(transaction.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
