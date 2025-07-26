import prisma from "@/lib/prisma";
import { UserRow } from "./columns";

interface UsersApiResponse {
  data: UserRow[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}
export async function getPaginatedUsers({
  search = "",
  page = 1,
  pageSize = 10,
}: {
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const whereClause: any = {};
  if (search) {
    whereClause.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive", // Case-insensitive search
        },
      },
      {
        email: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  // 3. Get total count of users matching the search criteria
  const totalCount = await prisma.user.count({
    where: whereClause,
  });

  // 4. Calculate pagination parameters
  const totalPages = Math.ceil(totalCount / pageSize);
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // 5. Fetch paginated and filtered users from the database
  const users = await prisma.user.findMany({
    where: whereClause,
    skip: skip,
    take: take,
    orderBy: {
      createdAt: "desc", // Or any other default sorting
    },
    // Select only the fields you need for the table
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
    },
  });

  // 6. Prepare the response object
  const mappedUsers: UserRow[] = users.map((user) => ({
    id: user.id,
    name: user.name ?? "", // Ensure name is always a string
    email: user.email,
    mealStatus: user.status as "on" | "off" | "suspended", // Map status to mealStatus
  }));

  const responseData: UsersApiResponse = {
    data: mappedUsers,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
  };
  return responseData;
}
