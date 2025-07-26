import { DataTable } from "@/components/table/data-table";
import { userColumns, type UserRow } from "./columns";
import { Suspense } from "react";

interface SearchParams {
  search?: string;
  page?: string;
  pageSize?: string;
}

interface UsersResponse {
  data: UserRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// Mock data - in real app, this would be your database
const mockUsers: UserRow[] = [
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
  {
    id: "6",
    name: "Charlie Green",
    email: "charlie.green@example.com",
    mealStatus: "on",
  },
  {
    id: "7",
    name: "Diana Blue",
    email: "diana.blue@example.com",
    mealStatus: "suspended",
  },
  {
    id: "8",
    name: "Edward Black",
    email: "edward.black@example.com",
    mealStatus: "off",
  },
  {
    id: "9",
    name: "Fiona Red",
    email: "fiona.red@example.com",
    mealStatus: "on",
  },
  {
    id: "10",
    name: "George Yellow",
    email: "george.yellow@example.com",
    mealStatus: "suspended",
  },
  {
    id: "11",
    name: "Helen Purple",
    email: "helen.purple@example.com",
    mealStatus: "on",
  },
  {
    id: "12",
    name: "Ian Orange",
    email: "ian.orange@example.com",
    mealStatus: "off",
  },
];

const getUsers = async (params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<UsersResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  const { search = "", page = 1, pageSize = 5 } = params;

  // Filter users based on search query
  let filteredUsers = mockUsers;
  if (search) {
    filteredUsers = mockUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()),
    );
  }

  // Calculate pagination
  const totalCount = filteredUsers.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Get paginated data
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    data: paginatedUsers,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
};

interface UsersPageProps {
  searchParams: SearchParams;
}

async function UsersContent({ searchParams }: UsersPageProps) {
  const search = searchParams.search || "";
  const page = Number.parseInt(searchParams.page || "1");
  const pageSize = Number.parseInt(searchParams.pageSize || "5");

  const usersResponse = await getUsers({ search, page, pageSize });

  return (
    <div className="space-y-4">
      <div className="mb-4 rounded-md">
        <h2 className="font-semibold">All Users</h2>
      </div>
      <DataTable
        columns={userColumns}
        data={usersResponse.data}
        pagination={{
          totalCount: usersResponse.totalCount,
          totalPages: usersResponse.totalPages,
          currentPage: usersResponse.currentPage,
          pageSize: usersResponse.pageSize,
        }}
        searchValue={search}
      />
    </div>
  );
}

export default function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UsersContent searchParams={searchParams} />
    </Suspense>
  );
}
