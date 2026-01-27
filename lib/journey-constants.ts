/**
 * Journey Constants - Shared types and default configurations
 * This file contains no server-side dependencies and can be imported by client components
 */

import { PhaseType } from "@prisma/client";

export interface PhaseConfig {
    phaseType: PhaseType;
    title: string;
    description?: string;
    durationDays: number;
    mentorId?: string;
}

export interface JourneyProgress {
    totalPhases: number;
    completedPhases: number;
    currentPhase: number;
    progressPercentage: number;
    daysElapsed?: number;
    daysRemaining?: number;
    expectedCompletionDate?: Date;
}

/**
 * Default phase configurations for new employees (90-day onboarding)
 */
export const DEFAULT_NEW_EMPLOYEE_PHASES: PhaseConfig[] = [
    {
        phaseType: PhaseType.INDUCTION_INITIAL_ASSESSMENT,
        title: "Initial Assessment",
        description: "Baseline skills assessment for new employee",
        durationDays: 2,
    },
    {
        phaseType: PhaseType.INDUCTION_TRAINING,
        title: "Induction Training",
        description: "Company orientation and initial training",
        durationDays: 15,
    },
    {
        phaseType: PhaseType.SKILL_ASSESSMENT,
        title: "Skill Assessment",
        description: "Comprehensive skill evaluation",
        durationDays: 3,
    },
    {
        phaseType: PhaseType.TNA_GENERATION,
        title: "TNA Generation",
        description: "Training Needs Analysis and planning",
        durationDays: 5,
    },
    {
        phaseType: PhaseType.PROGRESS_TRACKING,
        title: "Training Execution & Progress Tracking",
        description: "Execute training plan and track progress",
        durationDays: 15,
    },
    {
        phaseType: PhaseType.FEEDBACK_COLLECTION,
        title: "Feedback Collection",
        description: "Collect feedback on training effectiveness",
        durationDays: 2,
    },
    {
        phaseType: PhaseType.POST_ASSESSMENT,
        title: "Post-Assessment",
        description: "Final assessment to validate skill acquisition",
        durationDays: 3,
    },
];

/**
 * Default phase configurations for existing employees (cyclical development)
 */
export const DEFAULT_EXISTING_EMPLOYEE_PHASES: PhaseConfig[] = [
    {
        phaseType: PhaseType.ROLE_ASSESSMENT,
        title: "Role Assessment",
        description: "Assess skills against role requirements",
        durationDays: 3,
    },
    {
        phaseType: PhaseType.TRAINING_ASSIGNMENT,
        title: "Training Assignment",
        description: "Assign training based on skill gaps",
        durationDays: 2,
    },
    {
        phaseType: PhaseType.TRAINING_EXECUTION,
        title: "Training Execution",
        description: "Complete assigned training",
        durationDays: 30,
    },
    {
        phaseType: PhaseType.RE_ASSESSMENT,
        title: "Re-Assessment",
        description: "Validate skill improvement",
        durationDays: 2,
    },
    {
        phaseType: PhaseType.MATRIX_UPDATE,
        title: "Matrix Update",
        description: "Update skill matrix with new proficiency levels",
        durationDays: 1,
    },
];
