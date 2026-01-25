"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { userSchema } from "@/lib/validation";

export type UserFormState = {
  message?: string;
  errors?: {
    name?: string[];
    email?: string[];
    systemRoles?: string[];
    roleId?: string[];
  };
  success?: boolean;
};

export async function createUser(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    return {
      message: "Unauthorized",
      success: false,
    };
  }

  const validatedFields = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    systemRoles: JSON.parse(formData.get("systemRoles") as string || "[]"),
    roleId: formData.get("roleId"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed",
      success: false,
    };
  }

  try {
    await prisma.user.create({
      data: {
        name: validatedFields.data.name,
        email: validatedFields.data.email,
        systemRoles: validatedFields.data.systemRoles,
        // Default values for other fields
        employeeNo: validatedFields.data.employeeNo,
        designation: validatedFields.data.designation,
        department: validatedFields.data.department,
        location: validatedFields.data.location,
        level: validatedFields.data.level,
        roleId: validatedFields.data.roleId,
      },
    });

    revalidatePath("/admin/users");

    return {
      message: "User created successfully",
      success: true,
    };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    if (error.code === "P2002") {
      return {
        message: "Email already exists",
        success: false,
      };
    }
    return {
      message: "Failed to create user",
      success: false,
    };
  }
}

export async function updateUser(
  userId: string,
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    return {
      message: "Unauthorized",
      success: false,
    };
  }

  const data: any = {
    name: formData.get("name"),
    roleId: formData.get("roleId") as string | undefined,
  };

  const email = formData.get("email");
  if (email) {
    data.email = email;
  }

  const systemRoles = formData.get("systemRoles");
  if (systemRoles) {
    data.systemRoles = JSON.parse(systemRoles as string);
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    });

    revalidatePath("/admin/users");

    return {
      message: "User updated successfully",
      success: true,
    };
  } catch (error: any) {
    console.error("Failed to update user:", error);
    if (error.code === "P2002") {
      return {
        message: "Email already exists",
        success: false,
      };
    }
    return {
      message: "Failed to update user",
      success: false,
    };
  }
}

export async function deleteUser(userId: string): Promise<{
  message: string;
  success: boolean;
}> {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    return {
      message: "Unauthorized",
      success: false,
    };
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin/users");

    return {
      message: "User deleted successfully",
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return {
      message: "Failed to delete user",
      success: false,
    };
  }
}

export async function getUsers(params?: {
  role?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    throw new Error("Unauthorized");
  }

  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (params?.role) {
    where.systemRoles = { has: params.role };
  }

  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        assignedRole: {
          select: {
            name: true,
            department: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    pages: Math.ceil(total / pageSize),
    currentPage: page,
  };
}

export async function getUserById(userId: string) {
  const session = await auth();

  if (!session?.user?.systemRoles?.includes("ADMIN")) {
    throw new Error("Unauthorized");
  }

  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assignedRole: true,
    },
  });
}
