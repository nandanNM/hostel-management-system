import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Utensils } from "lucide-react";
import React from "react";

export default function OverviewCards() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="gap-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">
            Total Meals
          </CardTitle>
          <div className="rounded-lg bg-blue-500 p-2">
            <Utensils className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900">85</div>
          <p className="mt-1 flex items-center text-xs text-blue-600">
            <TrendingUp className="mr-1 h-3 w-3" />
            This month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
