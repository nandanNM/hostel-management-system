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
export default function RecentTransactions() {
  const recentTransactions = [
    {
      date: "2025-01-07",
      type: "Guest Meal",
      amount: -45,
      description: "Lunch - 1 Guest",
    },
    {
      date: "2025-01-06",
      type: "Regular Meal",
      amount: 0,
      description: "Dinner",
    },
    {
      date: "2025-01-05",
      type: "Guest Meal",
      amount: -45,
      description: "Breakfast - 1 Guest",
    },
    {
      date: "2025-01-04",
      type: "Payment",
      amount: 8500,
      description: "Monthly Payment",
    },
    {
      date: "2025-01-03",
      type: "Regular Meal",
      amount: 0,
      description: "Lunch",
    },
  ];
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
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="text-right font-semibold">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.map((transaction, index) => (
              <TableRow
                key={index}
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
