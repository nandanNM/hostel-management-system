import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gavel, LucideIcon, TrendingUp, Utensils, Wallet } from "lucide-react";
import { getUserDeshboardStats } from "../action";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function OverviewCards() {
  const { totalGuestMeals, totalPayedAmount, totalFines } =
    await getUserDeshboardStats();
  const cards = [
    {
      title: "Total Guest Meals",
      icon: Utensils,
      value: totalGuestMeals,
      color: "blue",
      subtitle: "All time",
    },
    {
      title: "Total Paid Amount",
      icon: Wallet,
      value: `₹${totalPayedAmount}`,
      color: "green",
      subtitle: "Till date",
    },
    {
      title: "Total Fines",
      icon: Gavel,
      value: `₹${totalFines}`,
      color: "red",
      subtitle: "All time",
    },
  ];
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, idx) => (
        <StatsCard key={idx} {...card} />
      ))}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  icon: LucideIcon;
  value: number | string;
  color: string;
  subtitle?: string;
}

export function StatsCard({
  title,
  icon: Icon,
  value,
  subtitle,
}: StatsCardProps) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className="h-full w-full rounded-full p-1">
            <Icon className={cn("size-5")} />
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {subtitle} <TrendingUp className="size-4" />
        </div>
      </CardFooter>
    </Card>
  );
}
