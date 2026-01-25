"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { skillSchema } from "@/lib/validation";
import { z } from "zod";

export type SkillFormState = {
    message?: string;
    errors?: {
        name?: string[];
        categoryId?: string[];
        description?: string[];
        proficiencyLevels?: string[];
    };
    success?: boolean;
};

export async function createSkill(
    prevState: SkillFormState,
    formData: FormData
): Promise<SkillFormState> {
    const session = await auth();

    if (!session?.user?.systemRoles?.includes("ADMIN")) {
        return {
            message: "Unauthorized",
            success: false,
        };
    }

    const validatedFields = skillSchema.safeParse({
        name: formData.get("name"),
        categoryId: formData.get("categoryId"),
        description: formData.get("description"),
        proficiencyLevels: formData.get("proficiencyLevels")
            ? JSON.parse(formData.get("proficiencyLevels") as string)
            : undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    try {
        await prisma.skill.create({
            data: {
                name: validatedFields.data.name,
                category: {
                    connect: { id: validatedFields.data.categoryId },
                },
                description: validatedFields.data.description,
                proficiencyLevels: validatedFields.data.proficiencyLevels || [
                    "Beginner",
                    "Intermediate",
                    "Advanced",
                    "Expert",
                ],
            },
        });

        revalidatePath("/admin/skills");

        return {
            message: "Skill created successfully",
            success: true,
        };
    } catch (error) {
        console.error("Failed to create skill:", error);
        return {
            message: "Failed to create skill",
            success: false,
        };
    }
}

export async function updateSkill(
    skillId: string,
    prevState: SkillFormState,
    formData: FormData
): Promise<SkillFormState> {
    const session = await auth();

    if (!session?.user?.systemRoles?.includes("ADMIN")) {
        return {
            message: "Unauthorized",
            success: false,
        };
    }

    const validatedFields = skillSchema.safeParse({
        name: formData.get("name"),
        categoryId: formData.get("categoryId"),
        description: formData.get("description"),
        proficiencyLevels: formData.get("proficiencyLevels")
            ? JSON.parse(formData.get("proficiencyLevels") as string)
            : undefined,
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    try {
        await prisma.skill.update({
            where: { id: skillId },
            data: {
                name: validatedFields.data.name,
                category: {
                    connect: { id: validatedFields.data.categoryId },
                },
                description: validatedFields.data.description,
                proficiencyLevels: validatedFields.data.proficiencyLevels || [
                    "Beginner",
                    "Intermediate",
                    "Advanced",
                    "Expert",
                ],
            },
        });

        revalidatePath("/admin/skills");

        return {
            message: "Skill updated successfully",
            success: true,
        };
    } catch (error) {
        console.error("Failed to update skill:", error);
        return {
            message: "Failed to update skill",
            success: false,
        };
    }
}

export async function deleteSkill(skillId: string): Promise<{
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
        await prisma.skill.delete({
            where: { id: skillId },
        });

        revalidatePath("/admin/skills");

        return {
            message: "Skill deleted successfully",
            success: true,
        };
    } catch (error) {
        console.error("Failed to delete skill:", error);
        return {
            message: "Failed to delete skill",
            success: false,
        };
    }
}

export async function getSkills(params?: {
    category?: string;
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

    if (params?.category) {
        where.categoryId = params.category;
    }

    if (params?.search) {
        where.OR = [
            { name: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
        ];
    }

    const [skills, total] = await Promise.all([
        prisma.skill.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: {
                createdAt: "desc",
            },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        colorClass: true,
                    },
                },
                _count: {
                    select: {
                        roleCompetencies: true,
                        skillMatrix: true,
                    },
                },
            },
        }),
        prisma.skill.count({ where }),
    ]);

    return {
        skills,
        total,
        pages: Math.ceil(total / pageSize),
        currentPage: page,
    };
}

export async function getSkillById(skillId: string) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    return await prisma.skill.findUnique({
        where: { id: skillId },
        include: {
            roleCompetencies: {
                include: {
                    role: true,
                },
            },
        },
    });
}
