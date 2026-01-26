/**
 * Skill Gap Analysis and Training Need Analysis (TNA) Type Definitions
 * Phase 5: Comprehensive skill gap tracking, analysis, and reporting
 */

import { CompetencyLevel } from '@prisma/client'

// ============================================================================
// CORE GAP ANALYSIS TYPES
// ============================================================================

/**
 * Represents skill gap data for a single user-skill combination
 * Combines skill matrix data with gap analysis calculations
 */
export type SkillGapData = {
  skillId: string
  skillName: string
  categoryId: string
  categoryName: string
  categoryColor: string
  desiredLevel: CompetencyLevel
  currentLevel: CompetencyLevel | null
  gapPercentage: number
  gapCategory: GapCategory
  lastAssessedDate: Date | null
  status: SkillMatrixStatus
  assessmentCount: number
  trainingAssigned: boolean
}

/**
 * Gap category classification based on percentage thresholds
 * - CRITICAL: >50% gap (requires immediate attention)
 * - HIGH: 30-50% gap (high priority training needed)
 * - MEDIUM: 15-30% gap (moderate priority)
 * - LOW: <15% gap (minor improvement needed)
 * - NONE: 0% gap (skill mastered at desired level)
 */
export enum GapCategory {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  NONE = 'NONE'
}

/**
 * Skill matrix status lifecycle
 * Tracks the progression of skill development
 */
export type SkillMatrixStatus = 
  | 'not_started'          // No assessment taken yet
  | 'gap_identified'       // Gap exists, no training assigned
  | 'training_assigned'    // Training scheduled/assigned
  | 'in_progress'          // Currently being developed
  | 'completed'            // Desired level achieved

// ============================================================================
// TRAINING NEED ANALYSIS (TNA) REPORT TYPES
// ============================================================================

/**
 * Individual employee TNA report
 * Comprehensive analysis of a single employee's skill gaps
 */
export type TNAReport = {
  userId: string
  userName: string
  email: string
  department: string | null
  roleId: string | null
  roleName: string | null
  skillGaps: SkillGapData[]
  overallGapScore: number           // Average gap percentage across all skills
  criticalGapsCount: number
  highGapsCount: number
  mediumGapsCount: number
  lowGapsCount: number
  skillsCompletedCount: number
  totalSkillsTracked: number
  recommendations: TrainingRecommendation[]
  generatedAt: Date
}

/**
 * Organization-wide TNA report
 * Aggregated analysis across all employees
 */
export type OrganizationTNA = {
  totalEmployees: number
  totalSkillsTracked: number
  organizationGapScore: number      // Average gap score across all employees
  criticalGapsTotal: number
  highGapsTotal: number
  mediumGapsTotal: number
  lowGapsTotal: number
  departmentBreakdown: DepartmentTNASummary[]
  roleBreakdown: RoleTNASummary[]
  topGapSkills: SkillGapSummary[]
  employeeTNAs: TNAReport[]
  generatedAt: Date
}

/**
 * Department-level TNA summary
 * Aggregated gap analysis for a specific department
 */
export type DepartmentTNASummary = {
  department: string
  employeeCount: number
  averageGapScore: number
  criticalGapsCount: number
  topGapSkills: string[]            // Top 5 skills with highest gaps
  trainingBudgetEstimate?: number   // Optional budget calculation
}

/**
 * Role-level TNA summary
 * Aggregated gap analysis for a specific job role
 */
export type RoleTNASummary = {
  roleId: string
  roleName: string
  employeeCount: number
  averageGapScore: number
  criticalGapsCount: number
  commonGapSkills: string[]         // Skills where most role holders have gaps
}

/**
 * Skill gap summary across organization
 * Identifies skills that require organization-wide training
 */
export type SkillGapSummary = {
  skillId: string
  skillName: string
  categoryName: string
  employeesAffected: number         // Number of employees with gap in this skill
  averageGap: number                // Average gap percentage
  recommendedTrainings: string[]    // List of training IDs that address this skill
}

// ============================================================================
// TRAINING RECOMMENDATION TYPES
// ============================================================================

/**
 * Training recommendation for addressing skill gaps
 * Generated based on gap analysis and training availability
 */
export type TrainingRecommendation = {
  trainingId: string
  trainingName: string
  skillId: string
  skillName: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  estimatedDuration: number         // Duration in hours
  mode: 'ONLINE' | 'OFFLINE'
  availableSeats?: number           // For offline trainings
  nextAvailableDate?: Date          // Next scheduled session
  mentorAvailable: boolean          // Whether mentor/trainer is assigned
  resources?: Array<{               // Related learning resources
    resourceId: string
    title: string
    url: string
    resourceType: string
    estimatedHours?: number
    provider?: string
    rating?: number
  }>
}

// ============================================================================
// FILTER & SEARCH TYPES
// ============================================================================

/**
 * Filters for gap analysis queries
 * Used in employee skill gap dashboard
 */
export type GapAnalysisFilters = {
  categoryId?: string               // Filter by skill category
  gapCategories?: GapCategory[]     // Filter by gap severity levels
  status?: SkillMatrixStatus[]      // Filter by skill matrix status
  searchTerm?: string               // Search skill names
}

/**
 * Filters for TNA report generation
 * Used in admin TNA interface
 */
export type TNAFilters = {
  department?: string               // Filter by department
  roleId?: string                   // Filter by job role
  gapCategory?: GapCategory         // Filter by minimum gap severity
  dateFrom?: Date                   // Filter assessments from date
  dateTo?: Date                     // Filter assessments to date
  includeCompleted?: boolean        // Include skills with no gaps
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Gap threshold configuration
 * Defines percentage thresholds for gap categorization
 */
export type GapThresholds = {
  critical: number                  // Default: 50
  high: number                      // Default: 30
  medium: number                    // Default: 15
}

// ============================================================================
// HISTORICAL TRACKING TYPES
// ============================================================================

/**
 * Historical gap trend data
 * Tracks gap changes over time for trend analysis
 */
export type GapTrend = {
  date: Date
  gapPercentage: number
  competencyLevel: CompetencyLevel | null
  assessmentId?: string
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Supported export formats for TNA reports
 */
export type ExportFormat = 'CSV' | 'PDF' | 'XLSX'

/**
 * Export configuration options
 * Defines what to include in exported reports
 */
export type ExportOptions = {
  format: ExportFormat
  includeCharts: boolean            // Include visualizations (PDF only)
  includeRecommendations: boolean   // Include training recommendations
  includeHistory: boolean           // Include assessment history
  filters: TNAFilters               // Applied filters
}
