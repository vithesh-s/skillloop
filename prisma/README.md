# Skill Loop Database Schema Documentation

This document provides comprehensive documentation for the Skill Loop database schema built with Prisma and PostgreSQL.

## Table of Contents

- [Overview](#overview)
- [Database Schema](#database-schema)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Models Reference](#models-reference)
- [Setup Instructions](#setup-instructions)
- [Seeding Process](#seeding-process)
- [Common Queries](#common-queries)
- [Migrations vs DB Push](#migrations-vs-db-push)
- [Troubleshooting](#troubleshooting)

## Overview

The Skill Loop database schema consists of **19 interconnected models** that manage the complete employee training lifecycle:

- **User Management**: Employee hierarchy with manager-reportee relationships
- **Skills & Competencies**: Skills catalog with role-based competency frameworks
- **Assessments**: Pre/post assessments with various question types and AI grading support
- **Training Management**: Online and offline training programs with scheduling
- **Progress Tracking**: Weekly updates, attendance, and proof of completion
- **Feedback & Notifications**: Training feedback and system notifications

## Database Schema

```mermaid
erDiagram
    User ||--o{ User : "manages"
    User ||--o{ AssessmentAttempt : "takes"
    User ||--o{ SkillMatrix : "has"
    User ||--o{ TrainingAssignment : "assigned"
    User ||--o{ Notification : "receives"
    User ||--o{ Assessment : "creates"
    User ||--o{ Training : "creates"
    
    Skill ||--o{ Assessment : "has"
    Skill ||--o{ SkillMatrix : "tracked in"
    Skill ||--o{ Training : "covered in"
    Skill ||--o{ RoleCompetency : "required for"
    
    Assessment ||--o{ Question : "contains"
    Assessment ||--o{ AssessmentAttempt : "attempted"
    
    Question ||--o{ Answer : "answered"
    
    AssessmentAttempt ||--o{ Answer : "includes"
    
    Training ||--o| OnlineTraining : "may be"
    Training ||--o| OfflineTraining : "may be"
    Training ||--o{ TrainingAssignment : "assigned"
    Training ||--o{ TrainingCalendar : "scheduled"
    
    TrainingAssignment ||--o{ ProgressUpdate : "tracked by"
    TrainingAssignment ||--o{ ProofOfCompletion : "completed with"
    TrainingAssignment ||--o{ Feedback : "rated by"
    
    TrainingCalendar ||--o{ Attendance : "recorded"
```

## Models Reference

### 1. User
**Purpose**: Core employee/user model with hierarchical manager-reportee relationships

**Key Fields**:
- `employeeNo`: Unique employee identifier
- `email`: Unique email address
- `role`: ADMIN | TRAINER | EMPLOYEE | MANAGER
- `managerId`: Self-referential for hierarchy
- `designation`, `department`, `location`: Organizational attributes
- `level`: Employee level/grade
- `resigned`: Soft delete flag

**Relations**: Manager, Reportees, AssessmentAttempts, SkillMatrix, TrainingAssignments, Notifications

### 2. Skill
**Purpose**: Catalog of technical and soft skills

**Key Fields**:
- `skillName`: Name of the skill (e.g., "C# Programming")
- `category`: Skill category (e.g., "Programming Language", "Framework")
- `description`: Detailed skill description

**Relations**: Assessments, SkillMatrix, Trainings, RoleCompetencies

### 3. Assessment
**Purpose**: Pre-assessment and post-assessment tests for skills

**Key Fields**:
- `title`: Assessment title
- `skillId`: Linked skill
- `totalMarks`, `passingScore`: Scoring configuration
- `duration`: Time limit in minutes
- `status`: DRAFT | PUBLISHED | ARCHIVED
- `isPreAssessment`: Flag for pre/post assessment

**Relations**: Skill, Questions, Attempts, Creator (User)

### 4. Question
**Purpose**: Assessment questions with various types and AI generation support

**Key Fields**:
- `questionText`: The question content
- `questionType`: MCQ | DESCRIPTIVE | TRUE_FALSE | FILL_BLANK
- `options`: JSON array for MCQ options
- `correctAnswer`: Answer key
- `difficultyLevel`: BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
- `aiGenerated`: Flag for AI-generated questions

**Relations**: Assessment, Answers

### 5. AssessmentAttempt
**Purpose**: Track individual user assessment attempts with scoring

**Key Fields**:
- `userId`, `assessmentId`: User and assessment references
- `score`, `percentage`: Scoring results
- `status`: "in_progress" | "completed" | "grading"
- `startedAt`, `completedAt`: Timing information

**Relations**: Assessment, User, Answers

### 6. Answer
**Purpose**: Individual question answers with AI grading support

**Key Fields**:
- `answerText`: User's answer
- `isCorrect`, `marksAwarded`: Grading results
- `aiGradingSuggestion`: JSON object with AI grading hints
- `trainerFeedback`: Manual feedback from trainer

**Relations**: AssessmentAttempt, Question

### 7. SkillMatrix
**Purpose**: Track skill gaps and competency levels for users

**Key Fields**:
- `userId`, `skillId`: User-skill mapping (unique combination)
- `desiredLevel`: Target competency level
- `currentLevel`: Actual competency level
- `gapPercentage`: Calculated gap (0-100%)
- `status`: "gap_identified" | "training_assigned" | "completed"

**Relations**: User, Skill

### 8. Training
**Purpose**: Training programs (online and offline)

**Key Fields**:
- `topicName`: Training topic
- `mode`: ONLINE | OFFLINE
- `duration`: Training duration in hours
- `skillId`: Related skill
- `resources`: JSON array of resources
- `maxParticipants`: Capacity limit

**Relations**: Skill, OnlineTraining, OfflineTraining, Assignments, Calendar, Creator

### 9. OnlineTraining
**Purpose**: Online-specific training metadata (1:1 with Training)

**Key Fields**:
- `resourceLinks`: JSON array of online resources
- `estimatedDuration`: Self-paced duration
- `mentorRequired`: Whether mentorship is needed

**Relations**: Training

### 10. OfflineTraining
**Purpose**: Offline-specific training metadata (1:1 with Training)

**Key Fields**:
- `schedule`: JSON schedule details
- `venue`: Physical location
- `materials`: JSON array of materials needed
- `trainerIds`: JSON array of trainer user IDs

**Relations**: Training

### 11. TrainingAssignment
**Purpose**: Assign trainings to users with trainers and mentors

**Key Fields**:
- `trainingId`, `userId`: Training-user mapping
- `trainerId`, `mentorId`: Assigned trainer and mentor
- `startDate`, `targetCompletionDate`: Timeline
- `status`: ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED

**Relations**: Training, User, Trainer, Mentor, ProgressUpdates, Proofs, Feedback

### 12. ProgressUpdate
**Purpose**: Weekly progress tracking for training assignments

**Key Fields**:
- `assignmentId`, `weekNumber`: Unique combination
- `completionPercentage`: Progress (0-100%)
- `topicsCovered`, `timeSpent`: Details
- `challenges`, `nextPlan`: Planning information
- `mentorComments`: Mentor feedback

**Relations**: TrainingAssignment

### 13. ProofOfCompletion
**Purpose**: Upload and review completion proofs (certificates, projects)

**Key Fields**:
- `fileName`, `filePath`: Uploaded file information
- `status`: PENDING | APPROVED | REJECTED
- `reviewerId`: Reviewer user ID
- `reviewerComments`, `reviewedAt`: Review details

**Relations**: TrainingAssignment, Reviewer (User)

### 14. Attendance
**Purpose**: Track attendance for offline training sessions

**Key Fields**:
- `calendarId`, `userId`: Unique combination
- `status`: PRESENT | ABSENT | LATE
- `remarks`: Additional notes

**Relations**: TrainingCalendar, User

### 15. TrainingCalendar
**Purpose**: Schedule training sessions with dates and venues

**Key Fields**:
- `trainingDate`: Session date and time
- `venue`, `meetingLink`: Location information
- `maxParticipants`: Session capacity
- `publishedAt`: Publication timestamp

**Relations**: Training, Attendance

### 16. Feedback
**Purpose**: Collect training and trainer feedback from participants

**Key Fields**:
- `assignmentId`, `submittedById`: Assignment-user mapping
- `trainerRating`, `contentRating`, `logisticsRating`: 1-5 ratings
- `overallRating`: Overall rating
- `comments`: Detailed feedback

**Relations**: TrainingAssignment, Submitter (User)

### 17. Notification
**Purpose**: System notifications for users

**Key Fields**:
- `recipientId`: User receiving notification
- `type`: ASSESSMENT_ASSIGNED | TRAINING_ASSIGNED | PROGRESS_DUE | FEEDBACK_PENDING | PROOF_SUBMITTED
- `subject`, `message`: Notification content
- `readStatus`: Read/unread flag

**Relations**: Recipient (User)

### 18. SystemConfig
**Purpose**: Application-wide configuration settings

**Key Fields**:
- `key`: Unique configuration key
- `value`: JSON configuration value
- `description`: Configuration description

**Configuration Examples**:
- `inductionDuration`: 90 days
- `passingScorePercentage`: 60%
- `progressUpdateFrequency`: 7 days
- `postTrainingAssessmentDelay`: 30 days
- `maxOTPAttempts`: 3
- `otpExpiryMinutes`: 5

### 19. RoleCompetency
**Purpose**: Define role-based competency frameworks

**Key Fields**:
- `jobRole`, `skillId`: Unique combination
- `requiredLevel`: BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
- `isMandatory`: Whether skill is mandatory for role

**Relations**: Skill

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Environment variables configured in `.env.local`

### Environment Variables

Create `.env.local` in the project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/skillloop?schema=public"
```

### Initial Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

3. **Push Schema to Database** (for development):
   ```bash
   npm run db:push
   ```
   
   OR **Create Migration** (for production):
   ```bash
   npm run db:migrate
   ```

4. **Seed Database**:
   ```bash
   npm run db:seed
   ```

5. **Open Prisma Studio** (optional):
   ```bash
   npm run db:studio
   ```

## Seeding Process

The seed script (`prisma/seed.ts`) performs the following operations:

### Step 1: Clear Existing Data (Development Only)
Deletes all records in reverse dependency order to avoid foreign key violations.

### Step 2: Load Employee Data
- Reads `Data/Exsisting-employee-dataoseed.json`
- Extracts 70 employee records with hierarchical relationships

### Step 3: Create Users
- Creates 70 users from employee data
- Assigns roles based on designation patterns:
  - "Managing Director" → ADMIN
  - "Manager" or "Lead" → MANAGER
  - "Trainer" or "Mentor" → TRAINER
  - Default → EMPLOYEE
- Establishes manager-reportee relationships using `pid` field

### Step 4: Create Demo Skills
Creates 10 C# .NET Blazor-focused skills:
- C# Programming
- .NET Core Framework
- Blazor WebAssembly
- Blazor Server
- Entity Framework Core
- ASP.NET Core Web API
- SQL Server
- Git Version Control
- Unit Testing (xUnit)
- Azure DevOps

### Step 5: Create Role Competencies
Defines competency frameworks for job roles:
- Software Engineer
- Senior Software Engineer
- Application Engineer
- Principal Engineer

### Step 6: Create Demo Assessments
Creates 3 assessments:
- C# Fundamentals Assessment
- .NET Blazor Basics
- Full Stack .NET Assessment

### Step 7: Create Demo Questions
Generates 25 questions across all assessments with various types:
- Multiple Choice Questions (MCQ)
- True/False
- Fill in the Blank
- Descriptive

### Step 8: Create System Configuration
Sets up 6 system configuration values for application behavior.

### Step 9: Create Initial Skill Matrix
Creates skill matrix records for 10 engineers linking them to relevant skills.

### Seed Output

```
🌱 Starting database seed...
📖 Loading employee data from JSON...
✅ Loaded 70 employees
👥 Creating users...
✅ Created 70 users with manager relationships
🎯 Creating demo skills...
✅ Created 10 skills
📊 Creating role competencies...
✅ Created 19 role competencies
📝 Creating demo assessments...
✅ Created 3 assessments
❓ Creating demo questions...
✅ Created 25 questions across all assessments
⚙️  Creating system configuration...
✅ Created 6 system configurations
📈 Creating initial skill matrix...
✅ Created 49 skill matrix records for 10 engineers
🎉 Database seeding completed successfully!
```

### Resetting the Database

To reset the database and re-seed:

```bash
# Push schema (recreates tables)
npm run db:push -- --force-reset

# OR drop and recreate database manually
# Then run:
npm run db:push
npm run db:seed
```

## Common Queries

### User Queries

```typescript
import { db } from '@/lib/db'

// Find user with manager and reportees
const user = await db.user.findUnique({
  where: { email: 'john.doe@company.com' },
  include: {
    manager: true,
    reportees: true,
    skillMatrix: {
      include: { skill: true }
    }
  }
})

// Get all employees in a department
const employees = await db.user.findMany({
  where: {
    department: 'Engineering',
    resigned: false
  },
  orderBy: { name: 'asc' }
})

// Get managers with their team size
const managers = await db.user.findMany({
  where: { role: 'MANAGER' },
  include: {
    _count: {
      select: { reportees: true }
    }
  }
})
```

### Assessment Queries

```typescript
// Get assessment with questions
const assessment = await db.assessment.findUnique({
  where: { id: 'assessment-id' },
  include: {
    questions: {
      orderBy: { orderIndex: 'asc' }
    },
    skill: true
  }
})

// Get user's assessment history
const attempts = await db.assessmentAttempt.findMany({
  where: { userId: 'user-id' },
  include: {
    assessment: {
      include: { skill: true }
    }
  },
  orderBy: { startedAt: 'desc' }
})

// Get assessment attempt with answers
const attempt = await db.assessmentAttempt.findUnique({
  where: { id: 'attempt-id' },
  include: {
    answers: {
      include: { question: true }
    },
    assessment: true
  }
})
```

### Skill Matrix Queries

```typescript
// Get user's skill gaps
const skillGaps = await db.skillMatrix.findMany({
  where: {
    userId: 'user-id',
    gapPercentage: { gt: 0 }
  },
  include: { skill: true },
  orderBy: { gapPercentage: 'desc' }
})

// Get skills by category
const skills = await db.skill.findMany({
  where: { category: 'Programming Language' },
  include: {
    _count: {
      select: {
        assessments: true,
        trainings: true
      }
    }
  }
})

// Get role competency requirements
const competencies = await db.roleCompetency.findMany({
  where: { jobRole: 'Software Engineer' },
  include: { skill: true },
  orderBy: { isMandatory: 'desc' }
})
```

### Training Queries

```typescript
// Get training with all details
const training = await db.training.findUnique({
  where: { id: 'training-id' },
  include: {
    skill: true,
    onlineTraining: true,
    offlineTraining: true,
    calendar: {
      include: { attendance: true }
    }
  }
})

// Get user's training assignments
const assignments = await db.trainingAssignment.findMany({
  where: { userId: 'user-id' },
  include: {
    training: {
      include: { skill: true }
    },
    trainer: true,
    mentor: true,
    progressUpdates: {
      orderBy: { weekNumber: 'asc' }
    }
  }
})

// Get training with progress
const assignment = await db.trainingAssignment.findUnique({
  where: { id: 'assignment-id' },
  include: {
    progressUpdates: {
      orderBy: { weekNumber: 'desc' },
      take: 1
    },
    proofs: true,
    feedback: true
  }
})
```

### Notification Queries

```typescript
// Get unread notifications
const notifications = await db.notification.findMany({
  where: {
    recipientId: 'user-id',
    readStatus: false
  },
  orderBy: { sentDate: 'desc' }
})

// Mark notification as read
await db.notification.update({
  where: { id: 'notification-id' },
  data: { readStatus: true }
})
```

### System Config Queries

```typescript
// Get configuration value
const config = await db.systemConfig.findUnique({
  where: { key: 'inductionDuration' }
})

const inductionDays = config?.value as number // 90

// Update configuration
await db.systemConfig.update({
  where: { key: 'passingScorePercentage' },
  data: { value: 65 }
})
```

## Migrations vs DB Push

### When to use `prisma db push`

- **Development/Prototyping**: Quick schema iterations
- **First-time setup**: Initial database setup
- **No migration history needed**: For throwaway databases

```bash
npm run db:push
```

**Pros**: Fast, no migration files, good for experimentation
**Cons**: No migration history, not suitable for production

### When to use `prisma migrate dev`

- **Production**: Trackable migration history
- **Team collaboration**: Share schema changes via migrations
- **Deployment**: Apply migrations in CI/CD pipeline

```bash
npm run db:migrate
```

**Pros**: Version control, rollback capability, production-ready
**Cons**: Slower, requires migration files management

### Migration Workflow

```bash
# 1. Make schema changes in prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_new_feature

# 3. Migration is applied and Prisma Client is regenerated

# 4. Commit migration files to version control
git add prisma/migrations
git commit -m "Add new feature migration"
```

### Production Deployment

```bash
# Apply migrations in production
npx prisma migrate deploy

# DO NOT use db:push in production!
```

## Troubleshooting

### Issue: Prisma Client not generating types

**Solution**:
```bash
# Delete generated client and regenerate
rm -rf node_modules/.prisma
npm run db:generate
```

### Issue: Database connection errors

**Solution**:
1. Verify `DATABASE_URL` in `.env.local`
2. Ensure PostgreSQL is running
3. Check database credentials and permissions
4. Test connection: `npx prisma db execute --sql "SELECT 1"`

### Issue: Migration conflicts

**Solution**:
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Then re-seed
npm run db:seed
```

### Issue: Seeding fails with foreign key violations

**Solution**:
- Ensure deletion order in seed script is correct (reverse dependencies)
- Check that all referenced IDs exist before creating records
- Use transactions for atomic operations

### Issue: Type errors after schema changes

**Solution**:
```bash
# Regenerate Prisma Client
npm run db:generate

# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: Slow queries

**Solution**:
1. Add indexes to frequently queried fields
2. Use `select` to limit returned fields
3. Implement pagination for large result sets
4. Use Prisma Studio to inspect query performance

### Issue: Prisma Studio not opening

**Solution**:
```bash
# Try different port
npx prisma studio --port 5556

# Or check if port 5555 is in use
netstat -ano | findstr :5555
```

### Issue: Hot reload causes multiple Prisma Client instances

**Solution**:
- The singleton pattern in `lib/prisma.ts` handles this
- If issues persist, restart the dev server:
  ```bash
  npm run dev
  ```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js with Prisma](https://www.prisma.io/nextjs)

## Support

For issues or questions:
1. Check this documentation
2. Review Prisma documentation
3. Consult the project team
4. Open an issue in the project repository

---

**Last Updated**: January 25, 2026
