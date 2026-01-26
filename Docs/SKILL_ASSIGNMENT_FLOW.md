# Skill Assignment and Gap Analysis Flow

## Overview

This document explains how skills are assigned to employees, how the system identifies gaps between existing skills and new skills that require training, and the complete workflow from skill assignment to training completion.

## Skill Assignment Methods

### 1. Role-Based Assignment (Automatic)

When an employee is assigned to a JobRole, all skills defined in that role's RoleCompetencies should be tracked in their SkillMatrix.

**Example:**
```typescript
// Job Role: Software Engineer
// Role Competencies:
- C# Programming → Required Level: INTERMEDIATE
- .NET Blazor → Required Level: INTERMEDIATE  
- SQL Server → Required Level: BEGINNER
- Git Version Control → Required Level: INTERMEDIATE
- Unit Testing → Required Level: BEGINNER

// When John is assigned to "Software Engineer" role:
// → System creates 5 SkillMatrix entries for John
// → Each entry has desiredLevel from RoleCompetency
```

### 2. Manual Assignment

Admins and Managers can manually assign additional skills to employees:

```typescript
// Through actions/skill-matrix.ts
await createSkillMatrixEntry({
  userId: "user123",
  skillId: "skill456",
  desiredLevel: "ADVANCED"
});
```

## Skill Types: Existing vs New

The system differentiates between two types of skills:

### Existing Skills (No Training Required Initially)

- **Definition**: Skills the employee already possesses
- **Indicator**: `currentLevel` field is set (not NULL)
- **Status**: `completed` if currentLevel >= desiredLevel
- **Gap Calculation**: Based on difference between current and desired
- **Workflow**: No assessment or training needed unless advancing to higher level

**Example:**
```typescript
{
  skillId: "csharp-id",
  userId: "john-id",
  desiredLevel: "INTERMEDIATE",
  currentLevel: "INTERMEDIATE",  // ✓ Already has this skill
  gapPercentage: 0,              // No gap
  status: "completed",
  lastAssessedDate: "2026-01-15"
}
```

### New Skills (Training Required)

- **Definition**: Skills the employee needs to learn
- **Indicator**: `currentLevel` field is NULL
- **Status**: `gap_identified`
- **Gap Calculation**: Always 100% gap
- **Workflow**: Requires assessment → training → reassessment

**Example:**
```typescript
{
  skillId: "blazor-id",
  userId: "john-id",
  desiredLevel: "INTERMEDIATE",
  currentLevel: null,            // ✗ Doesn't have this skill yet
  gapPercentage: 100,            // 100% gap
  status: "gap_identified",
  lastAssessedDate: null
}
```

## Complete Workflow

### For Existing Skills (Partial Gap)

```
1. Skill Assigned
   ↓
2. Current level assessed → INTERMEDIATE
   Desired level → ADVANCED
   Gap: 25%
   ↓
3. Training recommended (Level up)
   ↓
4. Employee completes training
   ↓
5. Post-assessment
   ↓
6. Current level updated → ADVANCED
   Gap: 0%
   Status: "completed"
```

### For New Skills (100% Gap)

```
1. Skill Assigned
   ↓
2. Current level → NULL
   Desired level → INTERMEDIATE
   Gap: 100%
   Status: "gap_identified"
   ↓
3. Pre-assessment scheduled
   ↓
4. Employee takes assessment
   ↓
5. Current level assessed → BEGINNER (baseline)
   Gap: 50%
   Status: "training_assigned"
   ↓
6. Training assigned with resources
   ↓
7. Employee completes training
   ↓
8. Post-assessment
   ↓
9. Current level updated → INTERMEDIATE
   Gap: 0%
   Status: "completed"
```

## Database Schema

### SkillMatrix Model

```prisma
model SkillMatrix {
  id               String           @id @default(cuid())
  userId           String
  skillId          String
  
  // Key fields for gap analysis:
  desiredLevel     CompetencyLevel  // Required level for role
  currentLevel     CompetencyLevel? // NULL = new skill, SET = existing skill
  gapPercentage    Float?           // Calculated gap
  lastAssessedDate DateTime?        // When last evaluated
  status           String           // "gap_identified", "training_assigned", "completed"
  
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  user  User  @relation(fields: [userId], references: [id])
  skill Skill @relation(fields: [skillId], references: [id])
  
  @@unique([userId, skillId])
}
```

## Gap Calculation Logic

```typescript
function calculateGap(desired: CompetencyLevel, current: CompetencyLevel | null): number {
  // Convert levels to numbers: BEGINNER=1, INTERMEDIATE=2, ADVANCED=3, EXPERT=4
  const desiredNum = levelToNumber(desired);
  const currentNum = current ? levelToNumber(current) : 0;
  
  if (currentNum === 0) return 100;            // New skill = 100% gap
  if (currentNum >= desiredNum) return 0;      // Met or exceeded = no gap
  
  return ((desiredNum - currentNum) / desiredNum) * 100;
}

// Examples:
// Desired: ADVANCED (3), Current: NULL (0)     → 100% gap
// Desired: ADVANCED (3), Current: BEGINNER (1) → 66.67% gap
// Desired: ADVANCED (3), Current: INTERMEDIATE (2) → 33.33% gap
// Desired: ADVANCED (3), Current: ADVANCED (3) → 0% gap
```

## Gap Categories

The system categorizes gaps into four severity levels:

```typescript
enum GapCategory {
  CRITICAL = "CRITICAL",  // > 50% gap
  HIGH = "HIGH",          // 30-50% gap
  MEDIUM = "MEDIUM",      // 15-30% gap
  LOW = "LOW"             // < 15% gap
}
```

## Status Transitions

```
gap_identified
    ↓
  (assessment scheduled)
    ↓
training_assigned
    ↓
  (training in progress)
    ↓
assessment_pending
    ↓
  (post-assessment taken)
    ↓
completed
```

## Seed Data Script

To populate realistic skill data for testing:

```bash
# Run the skill matrix seed
npx tsx prisma/seed-skill-matrix.ts
```

This will:
- Assign role competency skills to all 70 employees
- Set 40% as existing skills (with current levels)
- Set 60% as new skills (currentLevel = NULL)
- Calculate gap percentages
- Create realistic testing data

## Identifying Skill Types in UI

### Employee View (Skill Gaps Page)

**Existing Skill:**
```
C# Programming
Current: INTERMEDIATE → Desired: ADVANCED
Gap: 33.3%
Status: Training recommended
[Request Training] button
```

**New Skill:**
```
Blazor WebAssembly
Current: Not assessed → Desired: INTERMEDIATE
Gap: 100%
Status: Assessment required
[Take Pre-Assessment] button
```

### Admin View (TNA Reports)

The TNA report shows:
- Total skills tracked (both existing and new)
- Critical gaps (mostly new skills with 100% gaps)
- Training recommendations prioritized by gap severity

## Key Takeaways

1. **currentLevel field** is the key indicator:
   - NULL = New skill (needs assessment + training)
   - SET = Existing skill (may need level up training)

2. **Gap percentage** tells you skill proficiency:
   - 100% = Employee has no proficiency
   - 50% = Employee is halfway to desired level
   - 0% = Employee meets or exceeds desired level

3. **Status field** tracks progress:
   - `gap_identified` = Just assigned, needs action
   - `training_assigned` = Training in progress
   - `completed` = Met desired level

4. **Role-based assignment** ensures consistent skill tracking across similar positions

5. **Manual assignment** allows flexibility for specialized skills or career development

## Troubleshooting

### "Why is everything showing 0?"

**Cause**: No SkillMatrix entries exist
**Solution**: Run `npx tsx prisma/seed-skill-matrix.ts` to assign skills to users

### "Only 50 employees showing in TNA"

**Cause**: Pagination limit in generateOrganizationTNA
**Solution**: Already fixed - now shows all employees by default

### "How do I assign a skill to an employee?"

**Options**:
1. Assign them to a JobRole (automatic via role competencies)
2. Use createSkillMatrixEntry server action (manual admin assignment)

### "Should I set currentLevel when assigning a new skill?"

**Answer**: 
- If they already know the skill → Set currentLevel
- If they need to learn it → Leave currentLevel NULL
- System will determine baseline through pre-assessment
