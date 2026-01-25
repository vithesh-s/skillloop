"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { systemConfigSchema } from "@/lib/validation";

export type ConfigFormState = {
    message?: string;
    errors?: Record<string, string[]>;
    success?: boolean;
};

export async function updateSystemConfig(
    prevState: ConfigFormState,
    formData: FormData
): Promise<ConfigFormState> {
    const session = await auth();

    if (!session?.user?.systemRoles?.includes("ADMIN")) {
        return {
            message: "Unauthorized",
            success: false,
        };
    }

    const validatedFields = systemConfigSchema.safeParse({
        organizationName: formData.get("organizationName"),
        organizationEmail: formData.get("organizationEmail"),
        organizationWebsite: formData.get("organizationWebsite"),
        smtpHost: formData.get("smtpHost"),
        smtpPort: formData.get("smtpPort")
            ? parseInt(formData.get("smtpPort") as string)
            : undefined,
        smtpUser: formData.get("smtpUser"),
        smtpFrom: formData.get("smtpFrom"),
        enableOtpAuth: formData.get("enableOtpAuth") === "true",
        enableEmailNotifications: formData.get("enableEmailNotifications") === "true",
        assessmentPassPercentage: formData.get("assessmentPassPercentage")
            ? parseInt(formData.get("assessmentPassPercentage") as string)
            : undefined,
        trainingDaysBeforeReminder: formData.get("trainingDaysBeforeReminder")
            ? parseInt(formData.get("trainingDaysBeforeReminder") as string)
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
        const config = validatedFields.data;

        // Update or create each configuration
        for (const [key, value] of Object.entries(config)) {
            await prisma.systemConfig.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) },
            });
        }

        revalidatePath("/admin/config");

        return {
            message: "Configuration updated successfully",
            success: true,
        };
    } catch (error) {
        console.error("Failed to update configuration:", error);
        return {
            message: "Failed to update configuration",
            success: false,
        };
    }
}

export async function getSystemConfig() {
    const session = await auth();

    if (!session?.user?.systemRoles?.includes("ADMIN")) {
        throw new Error("Unauthorized");
    }

    const configs = await prisma.systemConfig.findMany();

    // Convert to object format
    const configObject: Record<string, string> = {};
    configs.forEach((config) => {
        configObject[config.key] = config.value;
    });

    return configObject;
}
