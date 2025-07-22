import { DataTable } from "@/components/table/data-table";
import { userColumns, UserRow } from "./columns";

const getUsers = async (): Promise<UserRow[]> => {
  return [
    {
      id: "1",
      name: "John Doe",
      email: "john.doe@example.com",
      mealStatus: "on",
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      mealStatus: "off",
    },
    {
      id: "3",
      name: "Peter Jones",
      email: "peter.jones@example.com",
      mealStatus: "suspended",
    },
    {
      id: "4",
      name: "Alice Brown",
      email: "alice.brown@example.com",
      mealStatus: "on",
    },
    {
      id: "5",
      name: "Bob White",
      email: "bob.white@example.com",
      mealStatus: "off",
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
