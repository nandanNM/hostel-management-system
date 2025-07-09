"use client";
"use client";

import {
  CalendarDays,
  CreditCard,
  DollarSign,
  Users,
  Utensils,
  User,
  TrendingUp,
  Clock,
} from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useId } from "react";

export default function Dashboard() {
  const id = useId();
  const userData = {
    name: "Rahul Sharma",
    rollNumber: "CS21B1045",
    room: "A-204",
    block: "A Block",
    phone: "+91 9876543210",
    email: "rahul.sharma@college.edu",
    mealPlan: "Full Board",
    joinDate: "Aug 2021",
  };

  const mealStats = {
    totalMeals: 85,
    guestMeals: 12,
    remainingMeals: 15,
    mealPlanDays: 30,
  };

  const financialData = {
    dueAmount: 2450,
    carryForward: 0,
    lastPayment: 8500,
    nextDueDate: "15 Jan 2025",
  };

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
    <div className="w-full md:mx-8 lg:mx-auto">
      <h2 className="mb-4 font-bold">User Dashboard</h2>
      <div className="mb-4 flex items-center gap-2">
        {/* swith */}
        <div className="inline-flex items-center gap-2 [--primary:var(--color-indigo-500)] [--ring:var(--color-indigo-300)] in-[.dark]:[--primary:var(--color-indigo-500)] in-[.dark]:[--ring:var(--color-indigo-900)]">
          <Switch id={id} className="cursor-pointer" defaultChecked />
          <Label htmlFor={id} className="sr-only">
            Colored switch
          </Label>
        </div>
        <span className="ml-2">Meal status: ON</span>
      </div>
      <Separator />
      {/* section 1 */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {userData.name}! 👋
          </h2>
          <p className="text-gray-600">
            Here&apos;s your mess account overview
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Stats Cards */}
          <div className="space-y-8 lg:col-span-2">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="transition-shadow duration-200 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">
                    Total Meals
                  </CardTitle>
                  <div className="rounded-lg bg-blue-500 p-2">
                    <Utensils className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900">
                    {mealStats.totalMeals}
                  </div>
                  <p className="mt-1 flex items-center text-xs text-blue-600">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-shadow duration-200 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">
                    Guest Meals
                  </CardTitle>
                  <div className="rounded-lg bg-green-500 p-2">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900">
                    {mealStats.guestMeals}
                  </div>
                  <p className="text-xs text-green-600">
                    ₹{mealStats.guestMeals * 45} charged
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-shadow duration-200 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">
                    Due Amount
                  </CardTitle>
                  <div className="rounded-lg bg-red-500 p-2">
                    <CreditCard className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-900">
                    ₹{financialData.dueAmount}
                  </div>
                  <p className="mt-1 flex items-center text-xs text-red-600">
                    <Clock className="mr-1 h-3 w-3" />
                    Due by {financialData.nextDueDate}
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-shadow duration-200 hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">
                    Remaining Meals
                  </CardTitle>
                  <div className="rounded-lg bg-purple-500 p-2">
                    <CalendarDays className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900">
                    {mealStats.remainingMeals}
                  </div>
                  <p className="text-xs text-purple-600">This month</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="transition-shadow duration-200 hover:shadow-lg">
              <CardHeader className="">
                <CardTitle className="text-xl">Recent Transactions</CardTitle>
                <CardDescription className="text-gray-500">
                  Your latest meal and payment history
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Type</TableHead>
                      <TableHead className="font-semibold">
                        Description
                      </TableHead>
                      <TableHead className="text-right font-semibold">
                        Amount
                      </TableHead>
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
          </div>

          {/* Right Column - User Profile & Financial Summary */}
          <div className="space-y-8">
            {/* User Profile Card */}
            <Card className="transition-shadow duration-200 hover:shadow-lg">
              <CardHeader className="">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Image
                      src="/placeholder.svg?height=80&width=80"
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {userData.name}
                    </h3>
                    <p className="font-medium text-indigo-600">
                      {userData.rollNumber}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-sm font-medium text-gray-600">
                      Room
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {userData.room}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-sm font-medium text-gray-600">
                      Block
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {userData.block}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-sm font-medium text-gray-600">
                      Phone
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {userData.phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-sm font-medium text-gray-600">
                      Email
                    </span>
                    <span className="text-xs font-bold text-gray-900">
                      {userData.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-sm font-medium text-gray-600">
                      Meal Plan
                    </span>
                    <Badge className="bg-green-500 text-white">
                      {userData.mealPlan}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="text-sm font-medium text-gray-600">
                      Member Since
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {userData.joinDate}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card className="transition-shadow duration-200 hover:shadow-lg">
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
                      ₹{financialData.dueAmount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <span className="text-sm font-medium text-blue-700">
                      Carry Forward
                    </span>
                    <span className="text-lg font-bold text-blue-800">
                      ₹{financialData.carryForward}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                    <span className="text-sm font-medium text-green-700">
                      Last Payment
                    </span>
                    <span className="text-lg font-bold text-green-800">
                      ₹{financialData.lastPayment}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <span className="text-sm font-medium text-orange-700">
                      Next Due Date
                    </span>
                    <span className="text-sm font-bold text-orange-800">
                      {financialData.nextDueDate}
                    </span>
                  </div>
                </div>
                <Separator />
                <Button className="w-full">Make Payment</Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="transition-shadow duration-200 hover:shadow-lg">
              <CardHeader className="">
                <CardTitle className="text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="lg"
                >
                  <Users className="mr-3 h-5 w-5" />
                  Add Guest Meal
                </Button>
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
        </div>
      </div>
    </div>
  );
}
