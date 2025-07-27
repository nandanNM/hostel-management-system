"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MealStatusType } from "@/generated/prisma";
import { GetMealWithUser } from "@/types/prisma.type";
interface MealActions {
  updateMealStatus: (mealId: string, status: MealStatusType) => Promise<void>;
  onViewProfile?: (meal: GetMealWithUser) => void;
}
export const createMealColumns = (
  actions: MealActions,
): ColumnDef<GetMealWithUser>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
  },
  {
    accessorFn: (row) => row.user.name ?? "No Name",
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorFn: (row) => row.user.email ?? "No Email",
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: "Meal Status",
    cell: ({ row }) => {
      const mealStatus = row.getValue("status") as string;
      return (
        <div
          className={cn(
            "w-max rounded-md px-2 py-1 text-xs font-medium capitalize",
            mealStatus === MealStatusType.ACTIVE &&
              "bg-green-100 text-green-800",
            mealStatus === MealStatusType.INACTIVE &&
              "bg-gray-100 text-gray-800",
            mealStatus === "suspended" && "bg-orange-100 text-orange-800",
          )}
        >
          {mealStatus === MealStatusType.ACTIVE
            ? "Meal On"
            : mealStatus === MealStatusType.INACTIVE
              ? "Meal Off"
              : "Suspended"}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const meal = row.original;
      const handleAction = async (action: string) => {
        switch (action) {
          case "activate-meal":
            await actions.updateMealStatus(meal.id, MealStatusType.ACTIVE);
            break;
          case "deactivate-meal":
            await actions.updateMealStatus(meal.id, MealStatusType.INACTIVE);
            break;
          case "suspend-meal":
            await actions.updateMealStatus(meal.id, MealStatusType.SUSPENDED);
            break;
          case "unsuspend-meal":
            await actions.updateMealStatus(meal.id, MealStatusType.ACTIVE);
            break;
          case "view":
            if (actions.onViewProfile) {
              actions.onViewProfile(meal);
            } else {
              console.log("View profile for meal:", meal.id);
            }
            break;
          default:
            console.log(`${action} meal for meal:`, meal.id);
        }
      };
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Meal Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(meal.id)}
              className="cursor-pointer"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy meal ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAction("view")}
              className="cursor-pointer"
            >
              <Eye className="mr-2 h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Meal Status Management */}
            {meal.status === MealStatusType.INACTIVE && (
              <DropdownMenuItem
                onClick={() => handleAction("activate-meal")}
                className="cursor-pointer text-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate Meal
              </DropdownMenuItem>
            )}
            {meal.status === MealStatusType.ACTIVE && (
              <DropdownMenuItem
                onClick={() => handleAction("deactivate-meal")}
                className="cursor-pointer text-gray-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate Meal
              </DropdownMenuItem>
            )}
            {meal.status !== MealStatusType.SUSPENDED && (
              <DropdownMenuItem
                onClick={() => handleAction("suspend-meal")}
                className="cursor-pointer text-orange-600"
              >
                <Clock className="mr-2 h-4 w-4" />
                Suspend Meal
              </DropdownMenuItem>
            )}
            {meal.status === MealStatusType.SUSPENDED && (
              <DropdownMenuItem
                onClick={() => handleAction("unsuspend-meal")}
                className="cursor-pointer text-blue-600"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Unsuspend Meal
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
