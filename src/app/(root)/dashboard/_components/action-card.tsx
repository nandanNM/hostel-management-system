import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, CreditCard, DollarSign, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import Link from "next/link";
import { User } from "@/generated/prisma";
interface ActionSidebarProps {
  user: User;
}

export default function ActionSidebar({ user }: ActionSidebarProps) {
  return (
    <div className="space-y-8">
      <FinancialCard carryForwardAmount={30} dueAmount={50} />
      <Card className="gap-3">
        <CardHeader className="">
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          <Link
            href="/guest-meal/create"
            className={buttonVariants({
              variant: "outline",
              className: "w-full justify-start bg-transparent",
            })}
          >
            <Users className="mr-3 h-5 w-5" />
            Add Guest Meal
          </Link>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            size="lg"
          >
            <CalendarDays className="mr-3 h-5 w-5" />
            View Meal Calendar
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start bg-transparent"
            size="lg"
          >
            <CreditCard className="mr-3 h-5 w-5" />
            Payment History
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface FinancialCardProps {
  dueAmount: number | null;
  carryForwardAmount: number | null;
}

function FinancialCard({ dueAmount, carryForwardAmount }: FinancialCardProps) {
  // Calculate next due date
  const today = new Date();
  let nextDueDate: Date;
  if (today.getDate() <= 10) {
    nextDueDate = new Date(today.getFullYear(), today.getMonth(), 10);
  } else {
    nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 10);
  }
  const formattedDueDate = `${String(nextDueDate.getDate()).padStart(2, "0")}/${String(nextDueDate.getMonth() + 1).padStart(2, "0")}/${nextDueDate.getFullYear()}`;

  return (
    <Card className="gap-3">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2 text-xl">
          <DollarSign className="h-5 w-5" />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4">
            <span className="text-sm font-medium text-red-700">
              Current Due
            </span>
            <span className="text-2xl font-bold text-red-800">
              ₹ {dueAmount}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
            <span className="text-sm font-medium text-blue-700">
              Carry Forward
            </span>
            <span className="text-lg font-bold text-blue-800">
              ₹ {carryForwardAmount}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
            <span className="text-sm font-medium text-orange-700">
              Next Due Date
            </span>
            <span className="text-sm font-bold text-orange-800">
              {formattedDueDate}
            </span>
          </div>
        </div>
        <Separator />
        <Button className="w-full">Make Payment</Button>
      </CardContent>
    </Card>
  );
}
