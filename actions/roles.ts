"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const roleSchema = z.object({
    name: z.string().min(1, "Role name is required"),
    department: z.string().min(1, "Department is required"),
    description: z.string().optional(),
    level: z.enum(["ENTRY", "MID", "SENIOR", "LEAD"]),
    competencies: z
        .array(
            z.object({
                skillId: z.string(),
                requiredLevel: z.string(),
                priority: z.enum(["REQUIRED", "PREFERRED", "OPTIONAL"]),
            })
        )
        .min(1, "At least one competency is required"),
});

export type RoleFormState = {
    message?: string;
    errors?: {
        name?: string[];
        department?: string[];
        description?: string[];
        level?: string[];
        competencies?: string[];
    };
    success?: boolean;
};

export async function createRole(
    prevState: RoleFormState,
    formData: FormData
): Promise<RoleFormState> {
    const session = await auth();

    if (!session?.user?.systemRoles?.includes("ADMIN")) {
        return {
            message: "Unauthorized",
            success: false,
        };
    }

    const competenciesRaw = formData.get("competencies");
    const competencies = competenciesRaw
        ? JSON.parse(competenciesRaw as string)
        : [];

    const validatedFields = roleSchema.safeParse({
        name: formData.get("name"),
        department: formData.get("department"),
        description: formData.get("description"),
        level: formData.get("level"),
        competencies,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    try {
        await prisma.jobRole.create({
            data: {
                name: validatedFields.data.name,
                department: validatedFields.data.department,
                description: validatedFields.data.description,
                level: validatedFields.data.level,
                competencies: {
                    create: validatedFields.data.competencies.map((comp) => ({
                        skillId: comp.skillId,
                        requiredLevel: comp.requiredLevel,
                        priority: comp.priority,
                    })),
                },
            },
        });

        revalidatePath("/admin/roles");

        return {
            message: "Role created successfully",
            success: true,
        };
    } catch (error) {
        console.error("Failed to create role:", error);
        return {
            message: "Failed to create role",
            success: false,
        };
    }
}

export async function updateRole(
    roleId: string,
    prevState: RoleFormState,
    formData: FormData
): Promise<RoleFormState> {
    const session = await auth();

    if (!session?.user?.systemRoles?.includes("ADMIN")) {
        return {
            message: "Unauthorized",
            success: false,
        };
    }

    const competenciesRaw = formData.get("competencies");
    const competencies = competenciesRaw
        ? JSON.parse(competenciesRaw as string)
        : [];

    const validatedFields = roleSchema.safeParse({
        name: formData.get("name"),
        department: formData.get("department"),
        description: formData.get("description"),
        level: formData.get("level"),
        competencies,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    try {
        // Delete existing competencies and create new ones
        await prisma.$transaction([
            prisma.roleCompetency.deleteMany({
                where: { roleId },
            }),
            prisma.jobRole.update({
                where: { id: roleId },
                data: {
                    name: validatedFields.data.name,
                    department: validatedFields.data.department,
                    description: validatedFields.data.description,
                    level: validatedFields.data.level,
                    competencies: {
                        create: validatedFields.data.competencies.map((comp) => ({
                            skillId: comp.skillId,
                            requiredLevel: comp.requiredLevel,
                            priority: comp.priority,
                        })),
                    },
                },
            }),
        ]);

        revalidatePath("/admin/roles");

        return {
            message: "Role updated successfully",
            success: true,
        };
    } catch (error) {
        console.error("Failed to update role:", error);
        return {
            message: "Failed to update role",
            success: false,
        };
    }
}

export async function deleteRole(roleId: string): Promise<{
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
        await prisma.jobRole.delete({
            where: { id: roleId },
        });

        revalidatePath("/admin/roles");

        return {
            message: "Role deleted successfully",
            success: true,
        };
    } catch (error) {
        console.error("Failed to delete role:", error);
        return {
            message: "Failed to delete role",
            success: false,
        };
    }
}

export async function getRoles(params?: {
    department?: string;
    level?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (params?.department) {
        where.department = params.department;
    }

    if (params?.level) {
        where.level = params.level;
    }

    if (params?.search) {
        where.OR = [
            { name: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
        ];
    }

    const [roles, total] = await Promise.all([
        prisma.jobRole.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                _count: {
                    select: {
                        competencies: true,
                        users: true,
                    },
                },
            },
        }),
        prisma.jobRole.count({ where }),
    ]);

    return {
        roles,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
    };
}

export async function getRoleById(roleId: string) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    return await prisma.jobRole.findUnique({
        where: { id: roleId },
        include: {
            competencies: {
                include: {
                    skill: true,
                },
            },
            users: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}

export async function getAllSkills() {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    return await prisma.skill.findMany({
        orderBy: {
            name: "asc",
        },
    });
}
