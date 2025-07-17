import { DataTable } from "@/components/table/data-table";
import { userColumns, UserRow } from "./columns";

const getUsers = async (): Promise<UserRow[]> => {
  return [
    {
      id: "6",
      name: "Emily Davis",
      email: "emily@example.com",
      dueAmount: 120.75,
      status: "active",
      role: "user",
    },
    {
      id: "7",
      name: "Franklin Moore",
      email: "franklin@example.com",
      dueAmount: 50.0,
      status: "suspended",
      role: "manager",
    },
    {
      id: "8",
      name: "Grace Taylor",
      email: "grace@example.com",
      dueAmount: 0,
      status: "active",
      role: "user",
    },
    {
      id: "9",
      name: "Henry Thomas",
      email: "henry@example.com",
      dueAmount: 340.0,
      status: "banned",
      role: "user",
    },
    {
      id: "10",
      name: "Isabella Martin",
      email: "isabella@example.com",
      dueAmount: 15.25,
      status: "active",
      role: "user",
    },
    {
      id: "11",
      name: "Jack White",
      email: "jack@example.com",
      dueAmount: 0,
      status: "inactive",
      role: "manager",
    },
    {
      id: "12",
      name: "Karen Harris",
      email: "karen@example.com",
      dueAmount: 500.0,
      status: "active",
      role: "admin",
    },
    {
      id: "13",
      name: "Leo Walker",
      email: "leo@example.com",
      dueAmount: 82.3,
      status: "active",
      role: "user",
    },
    {
      id: "14",
      name: "Mia Hall",
      email: "mia@example.com",
      dueAmount: 0,
      status: "suspended",
      role: "user",
    },
    {
      id: "15",
      name: "Nathan Allen",
      email: "nathan@example.com",
      dueAmount: 105.0,
      status: "banned",
      role: "user",
    },
    {
      id: "16",
      name: "Olivia Young",
      email: "olivia@example.com",
      dueAmount: 0,
      status: "active",
      role: "manager",
    },
    {
      id: "17",
      name: "Paul Hernandez",
      email: "paul@example.com",
      dueAmount: 49.99,
      status: "inactive",
      role: "user",
    },
    {
      id: "18",
      name: "Queenie Wright",
      email: "queenie@example.com",
      dueAmount: 250.5,
      status: "active",
      role: "admin",
    },
    {
      id: "19",
      name: "Ray Cooper",
      email: "ray@example.com",
      dueAmount: 0,
      status: "banned",
      role: "user",
    },
  ];
};

export default async function UsersPage() {
  const data = await getUsers();
  return (
    <div className="">
      <div className="mb-4 rounded-md">
        <h2 className="font-semibold">All Users</h2>
      </div>
      <DataTable columns={userColumns} data={data} />
    </div>
  );
}
