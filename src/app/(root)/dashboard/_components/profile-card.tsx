import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarDays,
  CreditCard,
  DollarSign,
  Users,
  User,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProfileCard() {
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

  const financialData = {
    dueAmount: 2450,
    carryForward: 0,
    lastPayment: 8500,
    nextDueDate: "15 Jan 2025",
  };

  return (
    <div className="space-y-8">
      <Card className="gap-3">
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
              <span className="text-sm font-medium text-gray-600">Room</span>
              <span className="text-sm font-bold text-gray-900">
                {userData.room}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-sm font-medium text-gray-600">Block</span>
              <span className="text-sm font-bold text-gray-900">
                {userData.block}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-sm font-medium text-gray-600">Phone</span>
              <span className="text-sm font-bold text-gray-900">
                {userData.phone}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <span className="text-sm font-medium text-gray-600">Email</span>
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
      <Card className="gap-3">
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
  );
}
