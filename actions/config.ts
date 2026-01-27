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

// ============================================================================
// REMINDER CONFIGURATION
// ============================================================================

export async function getReminderConfig() {
    const session = await auth();

    if (!session?.user?.systemRoles?.some(role => ['ADMIN', 'TRAINER', 'MANAGER'].includes(role))) {
        throw new Error("Unauthorized");
    }

    const defaults = {
        FEEDBACK_REMINDER_ENABLED: 'true',
        FEEDBACK_REMINDER_DAYS: '7',
        ASSESSMENT_REMINDER_DAYS: '3',
        PROGRESS_REMINDER_DAYS: '7',
    }

    const configs = await prisma.systemConfig.findMany({
        where: {
            key: {
                in: Object.keys(defaults),
            },
        },
    })

    const configObject: Record<string, string> = { ...defaults }
    configs.forEach((config) => {
        configObject[config.key] = config.value
    })

    return configObject
}

export async function updateReminderConfig(settings: {
    FEEDBACK_REMINDER_ENABLED?: boolean
    FEEDBACK_REMINDER_DAYS?: number
    ASSESSMENT_REMINDER_DAYS?: number
    PROGRESS_REMINDER_DAYS?: number
}) {
    const session = await auth()

    if (!session?.user?.systemRoles?.includes("ADMIN")) {
        throw new Error("Unauthorized")
    }

    try {
        const updates = []

        for (const [key, value] of Object.entries(settings)) {
            updates.push(
                prisma.systemConfig.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { 
                        key, 
                        value: String(value),
                        description: getConfigDescription(key),
                    },
                })
            )
        }

        await Promise.all(updates)
        revalidatePath("/admin/config")

        return {
            success: true,
            message: "Reminder configuration updated successfully",
        }
    } catch (error) {
        console.error("Failed to update reminder configuration:", error)
        return {
            success: false,
            error: "Failed to update reminder configuration",
        }
    }
}

function getConfigDescription(key: string): string {
    const descriptions: Record<string, string> = {
        FEEDBACK_REMINDER_ENABLED: 'Enable automatic feedback reminders',
        FEEDBACK_REMINDER_DAYS: 'Days after training completion to send feedback reminder',
        ASSESSMENT_REMINDER_DAYS: 'Days before assessment due date to send reminder',
        PROGRESS_REMINDER_DAYS: 'Days without progress update to send reminder',
    }
    return descriptions[key] || ''
}
