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

export type UserRow = {
  id: string;
  name: string;
  email: string;
  mealStatus: "on" | "off" | "suspended";
};

export const userColumns: ColumnDef<UserRow>[] = [
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
    accessorKey: "name",
    header: "Name",
  },
  {
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
    accessorKey: "mealStatus",
    header: "Meal Status",
    cell: ({ row }) => {
      const mealStatus = row.getValue("mealStatus") as string;
      return (
        <div
          className={cn(
            "w-max rounded-md px-2 py-1 text-xs font-medium capitalize",
            mealStatus === "on" && "bg-green-100 text-green-800",
            mealStatus === "off" && "bg-gray-100 text-gray-800",
            mealStatus === "suspended" && "bg-orange-100 text-orange-800",
          )}
        >
          {mealStatus === "on"
            ? "Meal On"
            : mealStatus === "off"
              ? "Meal Off"
              : "Suspended"}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      const handleAction = (action: string) => {
        // In a real app, you would call your API here to update user meal status
        console.log(`${action} meal for user:`, user.id);
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
              onClick={() => navigator.clipboard.writeText(user.id)}
              className="cursor-pointer"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy User ID
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
            {user.mealStatus === "off" && (
              <DropdownMenuItem
                onClick={() => handleAction("activate-meal")}
                className="cursor-pointer text-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate Meal
              </DropdownMenuItem>
            )}
            {user.mealStatus === "on" && (
              <DropdownMenuItem
                onClick={() => handleAction("deactivate-meal")}
                className="cursor-pointer text-gray-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate Meal
              </DropdownMenuItem>
            )}
            {user.mealStatus !== "suspended" && (
              <DropdownMenuItem
                onClick={() => handleAction("suspend-meal")}
                className="cursor-pointer text-orange-600"
              >
                <Clock className="mr-2 h-4 w-4" />
                Suspend Meal
              </DropdownMenuItem>
            )}
            {user.mealStatus === "suspended" && (
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
