# Skill Assignment Logic & Personal Skills Management

## Overview

This document explains how Skill Loop handles the distinction between:
1. **Personal Skills** - Skills users already possess
2. **Assigned Skills** - Skills required by the organization (job requirements)

## The Core Problem

When a user has a skill personally and an admin/manager assigns that same skill as a job requirement, the system needs to handle it intelligently without confusion.

**Example Scenario:**
- Vithesh learned **C# Programming** 3 years ago → He has ADVANCED proficiency
- His manager assigns **C# Programming** as a job requirement → Requires ADVANCED proficiency
- **Question:** Should Vithesh take training/assessment again? Or should the system recognize he already has the skill?

## The Solution: Two-Track Skill System

### Track 1: Personal Skills (Skills I Have)

These are skills the user has learned, assessed, or certified on their own or in previous roles.

**Characteristics:**
- `currentLevel` = `desiredLevel` (no gap exists)
- `gapPercentage` = 0%
- `status` = `'completed'`
- `lastAssessedDate` = date of last assessment/certification
- **NO training or assessment required**

**Database Example:**
```typescript
{
  userId: "vithesh-id",
  skillId: "csharp-id",
  currentLevel: CompetencyLevel.ADVANCED,
  desiredLevel: CompetencyLevel.ADVANCED,
  gapPercentage: 0,
  status: 'completed',
  lastAssessedDate: new Date('2023-01-15') // When he was assessed
}
```

**UI Display:**
- Show in "My Skills" or "Completed Skills" section
- Badge: ✅ Completed
- No training recommendations
- No assessment reminders

---

### Track 2: Assigned Skills (Job Requirements)

These are skills assigned by admin/manager as organizational requirements, regardless of whether the user already has them.

**Characteristics:**
- `desiredLevel` set by admin/manager
- `currentLevel` can be:
  - `NULL` → User doesn't have this skill (100% gap)
  - Lower than `desiredLevel` → User has it but not at required level (partial gap)
  - Equal to `desiredLevel` → User has it at required level but it's still tracked as requirement
- `gapPercentage` > 0 (if gap exists)
- `status` = `'gap_identified'` or `'in_progress'`
- **ALWAYS tracked as organizational requirement**

**Database Examples:**

**Case A: User doesn't have the skill**
```typescript
{
  userId: "vithesh-id",
  skillId: "azure-devops-id",
  currentLevel: null, // Never learned
  desiredLevel: CompetencyLevel.INTERMEDIATE,
  gapPercentage: 100,
  status: 'gap_identified',
  lastAssessedDate: null
}
```

**Case B: User has skill but needs higher level**
```typescript
{
  userId: "vithesh-id",
  skillId: "aspnet-api-id",
  currentLevel: CompetencyLevel.INTERMEDIATE, // Has basic knowledge
  desiredLevel: CompetencyLevel.ADVANCED, // Organization requires advanced
  gapPercentage: 33.33,
  status: 'gap_identified',
  lastAssessedDate: null
}
```

**Case C: User has skill at required level (but still tracked)**
```typescript
{
  userId: "vithesh-id",
  skillId: "csharp-id",
  currentLevel: CompetencyLevel.ADVANCED, // Has skill
  desiredLevel: CompetencyLevel.ADVANCED, // Matches requirement
  gapPercentage: 0,
  status: 'completed', // Or 'gap_identified' if formal assessment needed
  lastAssessedDate: null // Needs organizational assessment
}
```

**UI Display:**
- Show in "Required Skills" or "Job Requirements" section
- Badge: ⚠️ Training Required (if gap > 0)
- Training recommendations displayed
- Assessment reminders sent
- Tracked in TNA reports

---

## Handling Conflicts: When Admin Assigns Skill User Already Has

### Scenario

1. **Vithesh's Personal Skills:**
   - C# Programming: ADVANCED (self-taught, 3 years experience)
   - Status: completed, gap = 0%, no training needed

2. **Admin Assignment:**
   - Manager assigns "C# Programming" as job requirement
   - Desired level: ADVANCED (same as what Vithesh has)

### Two Approaches

#### ❌ Approach 1: Single Entry (NOT RECOMMENDED)

Update the existing personal skill entry to become an assigned skill.

**Problems:**
- Loses personal achievement history
- No distinction between personal vs organizational requirement
- Confuses the user ("Why do I need training if I already have this?")

#### ✅ Approach 2: Dual Entry (RECOMMENDED)

Keep both entries separate:

**Entry 1 (Personal):**
```typescript
{
  skillId: "csharp-id",
  currentLevel: ADVANCED,
  desiredLevel: ADVANCED,
  gapPercentage: 0,
  status: 'completed',
  source: 'PERSONAL', // Optional flag for clarity
  lastAssessedDate: new Date('2023-01-15')
}
```

**Entry 2 (Assigned):**
```typescript
{
  skillId: "csharp-id",
  currentLevel: ADVANCED, // Recognized from personal skill
  desiredLevel: ADVANCED, // Required by organization
  gapPercentage: 0,
  status: 'assessment_required', // Needs formal org assessment
  source: 'ASSIGNED',
  lastAssessedDate: null // No org assessment yet
}
```

**Benefits:**
- Clear separation of personal achievement vs organizational requirement
- Maintains history
- User understands: "I have the skill personally, but I need to prove it organizationally"
- Allows different desired levels (personal INTERMEDIATE, job requirement ADVANCED)

---

## Database Schema Recommendations

### Current SkillMatrix Model

```prisma
model SkillMatrix {
  id                String            @id @default(cuid())
  userId            String
  skillId           String
  desiredLevel      CompetencyLevel
  currentLevel      CompetencyLevel?
  gapPercentage     Float
  status            String
  lastAssessedDate  DateTime?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([userId, skillId])
  @@index([userId])
  @@index([skillId])
  @@index([status])
}
```

### Proposed Enhancement (Optional)

Add `source` field to distinguish origin:

```prisma
model SkillMatrix {
  // ... existing fields ...
  source            SkillSource       @default(ASSIGNED)
  
  @@unique([userId, skillId, source]) // Allow same skill twice
}

enum SkillSource {
  PERSONAL    // Self-reported, personal achievement
  ASSIGNED    // Organizational requirement
}
```

**Note:** Without schema change, you can use `status` and `gapPercentage` to infer:
- Personal: `status = 'completed' AND gapPercentage = 0`
- Assigned: `status != 'completed' OR gapPercentage > 0`

---

## User Workflows

### Workflow 1: Add Personal Skill

**Scenario:** Vithesh learned React independently and wants to add it to his profile.

**Process:**
1. Employee goes to "My Skills" page
2. Clicks "Add Skill" button
3. Searches for "React"
4. Selects proficiency: INTERMEDIATE
5. Optionally uploads certificate/proof
6. System creates SkillMatrix:
   ```typescript
   {
     currentLevel: INTERMEDIATE,
     desiredLevel: INTERMEDIATE,
     gapPercentage: 0,
     status: 'completed',
     source: 'PERSONAL' // Optional
   }
   ```

**Result:** Skill appears in "My Skills" section, NO training required.

---

### Workflow 2: Admin Assigns New Skill

**Scenario:** Manager assigns Python skill to Vithesh (he doesn't have it).

**Process:**
1. Manager/Admin goes to "Manage Skills" page
2. Selects user: Vithesh
3. Assigns skill: Python
4. Sets desired level: INTERMEDIATE
5. System creates SkillMatrix:
   ```typescript
   {
     currentLevel: null,
     desiredLevel: INTERMEDIATE,
     gapPercentage: 100,
     status: 'gap_identified',
     source: 'ASSIGNED'
   }
   ```

**Result:**
- Skill appears in Vithesh's "Required Training" section
- Training recommendations generated
- Email notification sent
- Shows in TNA report as gap

---

### Workflow 3: Admin Assigns Skill User Already Has

**Scenario:** Manager assigns C# (Vithesh has it at ADVANCED) as requirement (needs ADVANCED).

**Process:**
1. System checks if user has skill:
   - Query: `SkillMatrix WHERE userId=vithesh AND skillId=csharp AND source=PERSONAL`
   - Found: currentLevel = ADVANCED

2. System creates SEPARATE assigned entry:
   ```typescript
   {
     currentLevel: ADVANCED, // Copy from personal entry
     desiredLevel: ADVANCED, // Required by org
     gapPercentage: 0, // No gap since levels match
     status: 'assessment_required', // Needs formal assessment
     source: 'ASSIGNED'
   }
   ```

3. UI shows BOTH:
   - **My Skills:** ✅ C# Programming (ADVANCED) - Personal achievement
   - **Required Skills:** ⚠️ C# Programming (ADVANCED) - Needs organizational assessment

**Result:** User sees they have the skill but understands formal assessment is needed.

---

### Workflow 4: Admin Assigns Skill at Higher Level

**Scenario:** Manager assigns ASP.NET Web API (Vithesh has INTERMEDIATE) at ADVANCED.

**Process:**
1. System checks personal skill: currentLevel = INTERMEDIATE
2. System creates assigned entry:
   ```typescript
   {
     currentLevel: INTERMEDIATE, // Current proficiency
     desiredLevel: ADVANCED, // Higher requirement
     gapPercentage: 33.33,
     status: 'gap_identified',
     source: 'ASSIGNED'
   }
   ```

**Result:**
- **My Skills:** ✅ ASP.NET (INTERMEDIATE) - Personal
- **Required Skills:** ⚠️ ASP.NET (ADVANCED) - Needs training from INTERMEDIATE to ADVANCED

---

### Workflow 5: Remove Personal Skill

**Scenario:** Vithesh wants to remove a skill he added personally (e.g., jQuery - no longer relevant).

**Process:**
1. Go to "My Skills"
2. Find skill with `source = PERSONAL` or `gapPercentage = 0 AND status = completed`
3. Click "Remove" button
4. System deletes SkillMatrix entry

**Constraint:** Can only remove if:
- `source = 'PERSONAL'` (if field exists)
- OR `gapPercentage = 0 AND status = 'completed'` (no assigned requirement)

**Cannot remove if:**
- Skill is assigned by admin (`source = 'ASSIGNED'`)
- Skill is part of job requirement

---

## UI/UX Recommendations

### Employee Dashboard: My Skills Page

**Section 1: My Skills (Personal Achievements)**
```
✅ My Skills (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─ C# Programming              [ADVANCED] ✅
│  Last assessed: Jan 15, 2023
│  [View Certificate] [Remove]
│
┌─ SQL Server                  [INTERMEDIATE] ✅
│  Last assessed: Mar 10, 2023
│  [View Certificate] [Remove]
│
┌─ .NET Core                   [INTERMEDIATE] ✅
│  Last assessed: Jun 5, 2023
│  [View Certificate] [Remove]

[+ Add New Skill]
```

**Section 2: Required Skills (Organizational Requirements)**
```
⚠️ Required Skills (3)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─ ASP.NET Core Web API        [INTERMEDIATE → ADVANCED] ⚠️
│  Gap: 33% | Status: Training Required
│  📚 Training: 2 courses available
│  [Start Training] [View Details]
│
┌─ Azure DevOps                [NULL → INTERMEDIATE] 🔴
│  Gap: 100% | Status: Not Started
│  📚 Training: 3 courses available
│  [Start Learning] [View Details]
│
┌─ Entity Framework Core       [NULL → ADVANCED] 🔴
│  Gap: 100% | Status: Not Started
│  📚 Training: 4 courses available
│  [Start Learning] [View Details]
```

---

### Admin: Assign Skills Page

When assigning a skill:

1. **Check if user already has it (personal):**
   ```
   ℹ️ Vithesh already has this skill at INTERMEDIATE level.
   You are assigning it as organizational requirement at ADVANCED.
   
   This will:
   ✓ Create a gap of 33% (INTERMEDIATE → ADVANCED)
   ✓ Trigger training recommendations
   ✓ Require formal assessment
   
   [Assign Anyway] [Cancel]
   ```

2. **If user doesn't have it:**
   ```
   Assigning new skill: Python
   Desired level: INTERMEDIATE
   
   This will:
   ✓ Create 100% gap (user has no current proficiency)
   ✓ Trigger training recommendations
   ✓ Send notification to employee
   
   [Assign] [Cancel]
   ```

---

## API Design

### Get User Skills (Separated by Type)

```typescript
GET /api/skills/user/:userId

Response:
{
  personalSkills: [
    {
      id: "abc123",
      skillName: "C# Programming",
      currentLevel: "ADVANCED",
      desiredLevel: "ADVANCED",
      gapPercentage: 0,
      status: "completed",
      lastAssessedDate: "2023-01-15",
      source: "PERSONAL"
    }
  ],
  assignedSkills: [
    {
      id: "def456",
      skillName: "Azure DevOps",
      currentLevel: null,
      desiredLevel: "INTERMEDIATE",
      gapPercentage: 100,
      status: "gap_identified",
      source: "ASSIGNED",
      trainingRecommendations: [...]
    }
  ]
}
```

### Add Personal Skill

```typescript
POST /api/skills/personal

Body:
{
  userId: "vithesh-id",
  skillId: "react-id",
  currentLevel: "INTERMEDIATE",
  proofOfCompetency?: "certificate-url" // Optional
}

Logic:
1. Check if skill already assigned: SkillMatrix WHERE userId AND skillId AND source=ASSIGNED
2. If exists: Return error "This skill is already assigned as organizational requirement"
3. If not: Create new entry with:
   - currentLevel = desiredLevel (no gap)
   - gapPercentage = 0
   - status = 'completed'
   - source = 'PERSONAL'
```

### Assign Skill (Admin)

```typescript
POST /api/skills/assign

Body:
{
  userId: "vithesh-id",
  skillId: "python-id",
  desiredLevel: "INTERMEDIATE",
  assignedBy: "manager-id"
}

Logic:
1. Check if user has personal skill: SkillMatrix WHERE userId AND skillId AND source=PERSONAL
2. If exists:
   a. Get currentLevel from personal entry
   b. Create SEPARATE assigned entry with:
      - currentLevel = personal.currentLevel
      - desiredLevel = requested level
      - gapPercentage = calculated
      - source = 'ASSIGNED'
3. If not exists:
   a. Create assigned entry with:
      - currentLevel = null
      - desiredLevel = requested level
      - gapPercentage = 100
      - source = 'ASSIGNED'
4. Trigger training recommendation generation
5. Send notification to user
```

### Remove Personal Skill

```typescript
DELETE /api/skills/personal/:skillMatrixId

Logic:
1. Get SkillMatrix entry
2. Check source = 'PERSONAL' OR (gapPercentage = 0 AND status = 'completed')
3. If not: Return error "Cannot remove assigned skill"
4. Delete entry
```

---

## Testing Scenarios

### Test Case 1: Add Personal Skill
```
Given: User has no C# skill
When: User adds C# at INTERMEDIATE level (personal)
Then:
  ✓ SkillMatrix created with gap=0%, status=completed
  ✓ Appears in "My Skills" section
  ✓ NO training recommendations
```

### Test Case 2: Admin Assigns New Skill
```
Given: User has no Python skill
When: Admin assigns Python at INTERMEDIATE
Then:
  ✓ SkillMatrix created with gap=100%, status=gap_identified
  ✓ Appears in "Required Skills" section
  ✓ Training recommendations generated
  ✓ Notification sent to user
```

### Test Case 3: Admin Assigns Skill User Has (Same Level)
```
Given: User has C# at ADVANCED (personal)
When: Admin assigns C# at ADVANCED (organizational requirement)
Then:
  ✓ TWO SkillMatrix entries exist
  ✓ Personal entry: gap=0%, status=completed
  ✓ Assigned entry: gap=0%, status=assessment_required
  ✓ User sees both in UI
  ✓ Formal assessment reminder triggered
```

### Test Case 4: Admin Assigns Skill at Higher Level
```
Given: User has ASP.NET at INTERMEDIATE (personal)
When: Admin assigns ASP.NET at ADVANCED
Then:
  ✓ TWO SkillMatrix entries exist
  ✓ Personal entry: INTERMEDIATE → INTERMEDIATE (gap=0%)
  ✓ Assigned entry: INTERMEDIATE → ADVANCED (gap=33%)
  ✓ Training recommendations for gap
```

### Test Case 5: Remove Personal Skill (Allowed)
```
Given: User has jQuery at BEGINNER (personal, no assignment)
When: User removes jQuery
Then:
  ✓ SkillMatrix entry deleted
  ✓ Skill removed from "My Skills" section
```

### Test Case 6: Remove Assigned Skill (Blocked)
```
Given: User has Python skill (assigned by admin)
When: User tries to remove Python
Then:
  ✓ Error: "Cannot remove assigned skill"
  ✓ Skill remains in "Required Skills" section
```

---

## Summary

### Key Principles

1. **Separation of Concerns:** Personal skills ≠ Organizational requirements
2. **No Confusion:** Users understand what they have vs. what's required
3. **Audit Trail:** History preserved for both personal and assigned skills
4. **Flexibility:** Users can add personal skills; admins control requirements
5. **Clarity:** UI clearly distinguishes between skill types

### Database Strategy

**Without Schema Change:**
- Use `status` and `gapPercentage` to infer type
- Personal: `status='completed' AND gap=0%`
- Assigned: `status!='completed' OR gap>0%`

**With Schema Enhancement:**
- Add `source` enum: `PERSONAL | ASSIGNED`
- Allows duplicate skillId per user (one personal, one assigned)
- Clearer queries and logic

### Implementation Priority

1. ✅ **Phase 1:** Implement basic personal vs assigned logic (using existing fields)
2. ⏳ **Phase 2:** Add UI sections: "My Skills" vs "Required Skills"
3. ⏳ **Phase 3:** Add `source` field to schema for clarity
4. ⏳ **Phase 4:** Implement conflict detection and dual-entry logic
5. ⏳ **Phase 5:** Add training recommendation intelligence

---

## Next Steps

1. **Run the example seed:**
   ```bash
   npm run db:seed:vithesh
   ```

2. **Check Vithesh's skill matrix in database:**
   - 3 personal skills (gap=0%, completed)
   - 3 assigned skills (gap>0%, training required)

3. **View in UI:**
   - Login as vitheshs@acemicromatic.com
   - Go to Employee > Skill Gaps
   - Should see both personal and assigned skills

4. **Test admin assignment:**
   - Login as admin
   - Try assigning a skill Vithesh already has (C#)
   - Verify conflict handling

---

## Questions & Answers

**Q: Can a user remove a skill assigned by admin?**
A: No. Only personal skills (gap=0%, completed) can be removed by users. Assigned skills can only be removed by admins.

**Q: What if user has a skill at ADVANCED but admin assigns it at BEGINNER?**
A: System creates assigned entry with currentLevel=ADVANCED, desiredLevel=BEGINNER. Since current ≥ desired, gap=0% and status could be 'completed' or 'assessment_required' depending on business logic.

**Q: Should we allow multiple entries of same skill?**
A: Yes, recommended. One for personal, one for assigned. Requires removing unique constraint on `[userId, skillId]` or adding `source` to the unique constraint.

**Q: How to handle skill expiration (e.g., certifications expire)?**
A: Add `expiresAt` field to SkillMatrix. Personal skills with expired assessments should show warning and may need reassessment.

**Q: What if user completes assigned training?**
A: Update assigned entry: set currentLevel=desiredLevel, gap=0%, status='completed', lastAssessedDate=now(). Personal entry remains unchanged.

---

**Document Version:** 1.0
**Last Updated:** January 26, 2026
**Author:** Skill Loop Development Team
