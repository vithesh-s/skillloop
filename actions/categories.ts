"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categorySchema = z.object({
    name: z.string().min(1, "Category name is required").max(50),
    description: z.string().optional(),
    colorClass: z.string().min(1, "Color is required"),
});

export type CategoryFormState = {
    message?: string;
    errors?: {
        name?: string[];
        description?: string[];
        colorClass?: string[];
    };
    success?: boolean;
    categoryId?: string;
};

// Get all categories (accessible to all authenticated users)
export async function getCategories() {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized");
    }

    try {
        const categories = await prisma.skillCategory.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { skills: true },
                },
            },
        });

        return categories;
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        throw new Error("Failed to fetch categories");
    }
}

// Create a new category (ADMIN only)
export async function createCategory(
    prevState: CategoryFormState,
    formData: FormData
): Promise<CategoryFormState> {
    const session = await auth();

    if (!session?.user?.systemRoles?.includes("ADMIN")) {
        return {
            message: "Unauthorized",
            success: false,
        };
    }

    const validatedFields = categorySchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description") || undefined,
        colorClass: formData.get("colorClass"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    try {
        const category = await prisma.skillCategory.create({
            data: {
                name: validatedFields.data.name,
                description: validatedFields.data.description,
                colorClass: validatedFields.data.colorClass,
            },
        });

        revalidatePath("/admin/skills");
        revalidatePath("/admin/categories");

        return {
            message: "Category created successfully",
            success: true,
            categoryId: category.id,
        };
    } catch (error: any) {
        console.error("Failed to create category:", error);

        if (error.code === "P2002") {
            return {
                errors: {
                    name: ["A category with this name already exists"],
                },
                message: "Category already exists",
                success: false,
            };
        }

        return {
            message: "Failed to create category",
            success: false,
        };
    }
}

// Create category by name only (used for inline creation)
export async function createCategoryByName(
    name: string
): Promise<{ success: boolean; categoryId?: string; message?: string }> {
    const session = await auth();

    if (!session?.user) {
        return {
            success: false,
            message: "Unauthorized",
        };
    }

    try {
        // Check if category already exists
        const existing = await prisma.skillCategory.findUnique({
            where: { name },
        });

        if (existing) {
            return {
                success: true,
                categoryId: existing.id,
            };
        }

        // Define default colors for new categories
        const defaultColors = [
            "blue-500",
            "green-500",
            "purple-500",
            "orange-500",
            "pink-500",
            "indigo-500",
            "teal-500",
            "red-500",
            "yellow-500",
            "cyan-500",
        ];

        // Get random color
        const colorClass =
            defaultColors[Math.floor(Math.random() * defaultColors.length)];

        const category = await prisma.skillCategory.create({
            data: {
                name,
                colorClass,
            },
        });

        revalidatePath("/admin/skills");
        revalidatePath("/admin/categories");

        return {
            success: true,
            categoryId: category.id,
        };
    } catch (error) {
        console.error("Failed to create category:", error);
        return {
            success: false,
            message: "Failed to create category",
        };
    }
}

// Update category (ADMIN only)
export async function updateCategory(
    categoryId: string,
    prevState: CategoryFormState,
    formData: FormData
): Promise<CategoryFormState> {
    const session = await auth();

    if (!session?.user?.systemRoles?.includes("ADMIN")) {
        return {
            message: "Unauthorized",
            success: false,
        };
    }

    const validatedFields = categorySchema.safeParse({
        name: formData.get("name"),
        description: formData.get("description") || undefined,
        colorClass: formData.get("colorClass"),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Validation failed",
            success: false,
        };
    }

    try {
        await prisma.skillCategory.update({
            where: { id: categoryId },
            data: {
                name: validatedFields.data.name,
                description: validatedFields.data.description,
                colorClass: validatedFields.data.colorClass,
            },
        });

        revalidatePath("/admin/skills");
        revalidatePath("/admin/categories");

        return {
            message: "Category updated successfully",
            success: true,
        };
    } catch (error: any) {
        console.error("Failed to update category:", error);

        if (error.code === "P2002") {
            return {
                errors: {
                    name: ["A category with this name already exists"],
                },
                message: "Category already exists",
                success: false,
            };
        }

        return {
            message: "Failed to update category",
            success: false,
        };
    }
}

// Delete category (ADMIN only)
export async function deleteCategory(categoryId: string): Promise<{
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
        // Check if category has skills
        const category = await prisma.skillCategory.findUnique({
            where: { id: categoryId },
            include: {
                _count: {
                    select: { skills: true },
                },
            },
        });

        if (!category) {
            return {
                message: "Category not found",
                success: false,
            };
        }

        if (category._count.skills > 0) {
            return {
                message: `Cannot delete category with ${category._count.skills} associated skills`,
                success: false,
            };
        }

        await prisma.skillCategory.delete({
            where: { id: categoryId },
        });

        revalidatePath("/admin/skills");
        revalidatePath("/admin/categories");

        return {
            message: "Category deleted successfully",
            success: true,
        };
    } catch (error) {
        console.error("Failed to delete category:", error);
        return {
            message: "Failed to delete category",
            success: false,
        };
    }
}
