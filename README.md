# Skill Loop - Enterprise Training & Skills Management System

A comprehensive training management platform built with Next.js 16, designed to manage employee skills, assessments, training programs, and career development journeys with advanced analytics and competency tracking.

## 🎯 Overview

Skill Loop is an enterprise-grade Learning Management System (LMS) that combines skills management, competency assessment, training delivery, and career journey tracking into a unified platform. It supports role-based access control with four distinct user roles (Admin, Manager, Trainer, Employee) and provides real-time progress tracking, automated notifications, and comprehensive analytics.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/skillloop?schema=public"
```

### Database Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Generate Prisma Client**:
```bash
npm run db:generate
```

3. **Push schema to database** (development):
```bash
npm run db:push
```

4. **Seed the database** with demo data:
```bash
npm run db:seed
```

5. **Open Prisma Studio** to view data (optional):
```bash
npm run db:studio
```

**Database Commands**:
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:seed` - Seed database with demo data
- `npm run db:studio` - Open Prisma Studio

For detailed database documentation, see [prisma/README.md](prisma/README.md).

### Run Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Browser)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Admin UI    │  │  Manager UI  │  │ Employee UI  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              Next.js 16 Application Server                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  App Router (RSC) - Server Components              │   │
│  │  ├── (auth)      - Login/Authentication            │   │
│  │  ├── (dashboard) - Role-based Dashboards           │   │
│  │  │   ├── /admin      - Full system control         │   │
│  │  │   ├── /manager    - Team management             │   │
│  │  │   ├── /trainer    - Training delivery           │   │
│  │  │   └── /employee   - Self-service portal         │   │
│  │  └── /api        - API Routes & Webhooks           │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Server Actions Layer                                │   │
│  │  ├── assessments.ts  - Assessment operations        │   │
│  │  ├── trainings.ts    - Training CRUD                │   │
│  │  ├── skills.ts       - Skills management            │   │
│  │  ├── users.ts        - User operations              │   │
│  │  ├── progress.ts     - Progress tracking            │   │
│  │  ├── feedback.ts     - Feedback system              │   │
│  │  ├── journeys.ts     - Journey lifecycle            │   │
│  │  └── skill-matrix.ts - Competency matrix            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Authentication & Authorization (NextAuth.js)       │   │
│  │  ├── Credential Provider (Email + Password + OTP)   │   │
│  │  ├── JWT Session Management                         │   │
│  │  ├── Role-based Access Control (RBAC)               │   │
│  │  └── Route Protection Middleware                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (19 Models)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Users &    │  │   Skills &   │  │ Assessments  │     │
│  │   Roles      │  │  Competency  │  │  & Results   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Trainings   │  │   Progress   │  │   Journeys   │     │
│  │  & Proofs    │  │  & Feedback  │  │  & Phases    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

- **Framework**: Next.js 16.1.4 (App Router with Turbopack)
- **Runtime**: React 19 with Server Components (RSC)
- **Database**: PostgreSQL with Prisma ORM 7.3.0
- **Authentication**: NextAuth.js v5 with JWT + OTP
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4
- **File Upload**: UploadThing
- **Email**: Nodemailer
- **Language**: TypeScript 5
- **Validation**: Zod schemas
- **Date Handling**: date-fns
- **Icons**: Lucide React

## 🎭 User Roles & Permissions

### Role Hierarchy

```
ADMIN (Full System Access)
  ↓
MANAGER (Team Management)
  ↓
TRAINER (Training Delivery)
  ↓
EMPLOYEE (Self-Service)
```

### Permission Matrix

| Feature | Admin | Manager | Trainer | Employee |
|---------|-------|---------|---------|----------|
| User Management | ✅ CRUD | ✅ View Team | ❌ | ❌ |
| Role Assignment | ✅ All Roles | ✅ Employee Only | ❌ | ❌ |
| Skills Catalog | ✅ CRUD | ✅ View | ✅ View | ✅ View |
| Skill Assignment | ✅ All Users | ✅ Team Only | ✅ Trainees | ❌ |
| Assessment Creation | ✅ | ✅ | ✅ | ❌ |
| Assessment Assignment | ✅ All | ✅ Team | ✅ Trainees | ❌ |
| Assessment Taking | ✅ | ✅ | ✅ | ✅ |
| Training Creation | ✅ | ✅ | ✅ | ❌ |
| Training Assignment | ✅ All | ✅ Team | ✅ Trainees | ❌ |
| Training Approval | ✅ | ✅ | ✅ | ❌ |
| Journey Management | ✅ CRUD | ✅ View Team | ❌ | ❌ |
| Progress Tracking | ✅ All | ✅ Team | ✅ Trainees | ✅ Own |
| Analytics & Reports | ✅ System-wide | ✅ Team | ✅ Training | ✅ Personal |
| Feedback | ✅ View All | ✅ View Team | ✅ Review | ✅ Submit |
| Notifications | ✅ Manage | ✅ View | ✅ View | ✅ View |

## 🔄 Core Workflows

### 1. Employee Onboarding Journey (90-Day Plan)

```
┌─────────────────────────────────────────────────────────────┐
│               NEW EMPLOYEE JOURNEY LIFECYCLE                 │
└─────────────────────────────────────────────────────────────┘

Day 1: Journey Creation (Admin/Manager)
  ↓
[AUTO] Employee journey initialized
  ├── Journey Status: IN_PROGRESS
  ├── Journey Type: NEW_EMPLOYEE
  ├── Duration: 90 days
  └── Phases: Auto-generated (6 phases)
  
Phase 1: Orientation (Days 1-7)
  ├── Welcome session
  ├── Company policies
  ├── Tool setup
  └── Mentor assignment
  ↓
Phase 2: Basic Training (Days 8-21)
  ├── Core competencies
  ├── Required assessments
  ├── Initial skill assignments
  └── Progress tracking
  ↓
Phase 3: Skill Development (Days 22-45)
  ├── Department-specific training
  ├── Hands-on projects
  ├── Competency assessments
  └── Feedback collection
  ↓
Phase 4: Advanced Training (Days 46-60)
  ├── Advanced skills
  ├── Cross-functional training
  ├── Practice proofs submission
  └── Mentor reviews
  ↓
Phase 5: Integration (Days 61-75)
  ├── Independent work
  ├── Team collaboration
  ├── Skill validation
  └── Performance reviews
  ↓
Phase 6: Evaluation (Days 76-90)
  ├── Final assessments
  ├── Competency certification
  ├── Journey completion
  └── Transition to regular cycle

[AUTO] Notifications sent at each phase
[AUTO] Progress tracked daily
[AUTO] Mentor reviews scheduled
[AUTO] Manager updates triggered
```

### 2. Skill Assignment & Assessment Flow

```
┌─────────────────────────────────────────────────────────────┐
│              SKILLS MANAGEMENT WORKFLOW                      │
└─────────────────────────────────────────────────────────────┘

Step 1: Skill Creation (Admin)
  ├── Define skill name, category, level
  ├── Set competency criteria
  ├── Configure assessment requirements
  └── Publish to skills catalog
  ↓
Step 2: Skill Assignment (Manager/Admin)
  ├── Select users/departments
  ├── Set target competency level
  ├── Define deadline
  ├── Mark as mandatory/optional
  └── [AUTO] Notification sent to users
  ↓
Step 3: Employee Assessment
  ├── View assigned skills
  ├── Self-assessment (optional)
  ├── Take formal assessment
  │   ├── Multiple choice questions
  │   ├── True/False questions
  │   ├── Descriptive questions
  │   └── Practice-based tasks
  └── Submit for review
  ↓
Step 4: Assessment Evaluation
  ├── Auto-scoring (MCQ/TF)
  ├── Manual review (Descriptive)
  ├── Proof verification (Practice)
  └── Final score calculation
  ↓
Step 5: Competency Update
  ├── Update skill level (BEGINNER → EXPERT)
  ├── Update skill matrix
  ├── Trigger gap analysis
  ├── Generate recommendations
  └── [AUTO] Notify stakeholders
  ↓
Step 6: Continuous Improvement
  ├── Periodic re-assessment
  ├── Skill gap identification
  ├── Training recommendations
  └── Progress tracking
```

### 3. Training Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│              TRAINING LIFECYCLE WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

Training Creation (Trainer/Admin)
  ├── Online Training
  │   ├── Upload materials (videos, docs, links)
  │   ├── Set learning objectives
  │   ├── Configure assessments
  │   └── Define duration & prerequisites
  │
  └── Offline Training
      ├── Schedule date, time, location
      ├── Set trainer & capacity
      ├── Upload materials
      └── Configure attendance tracking
  ↓
Training Assignment (Manager/Trainer)
  ├── Select trainees
  ├── Set priority & deadline
  ├── Link to skills/journey phases
  └── [AUTO] Calendar invites sent
  ↓
Training Delivery
  ├── Online: Self-paced learning
  │   ├── Material access
  │   ├── Progress tracking
  │   ├── Quiz completion
  │   └── Certificate generation
  │
  └── Offline: Instructor-led
      ├── Attendance marking
      ├── Live interaction
      ├── Hands-on practice
      └── Session feedback
  ↓
Proof Submission (Employee)
  ├── Upload completion proof
  ├── Add notes/observations
  ├── Submit for verification
  └── [AUTO] Notify mentor/trainer
  ↓
Mentor Review (Trainer/Mentor)
  ├── Verify proofs
  ├── Provide feedback
  ├── Approve/Request changes
  └── Update training status
  ↓
Training Completion
  ├── Status: COMPLETED
  ├── Update skill proficiency
  ├── Generate certificate
  ├── Update journey progress
  └── [AUTO] Notify all stakeholders
```

### 4. Assessment System Flow

```
┌─────────────────────────────────────────────────────────────┐
│            COMPREHENSIVE ASSESSMENT FLOW                     │
└─────────────────────────────────────────────────────────────┘

Assessment Design (Admin/Manager/Trainer)
  ├── Define assessment details
  │   ├── Title, description, category
  │   ├── Skill linkage
  │   └── Passing criteria (threshold)
  │
  ├── Add Questions
  │   ├── MULTIPLE_CHOICE (auto-scored)
  │   ├── TRUE_FALSE (auto-scored)
  │   ├── DESCRIPTIVE (manual review)
  │   └── PRACTICE (proof-based)
  │
  └── Configure Settings
      ├── Time limit
      ├── Attempts allowed
      ├── Random question order
      └── Show correct answers
  ↓
Assessment Assignment
  ├── Assign to users/groups
  ├── Set deadline
  ├── Link to journey phase (optional)
  └── [AUTO] Email notification
  ↓
Assessment Taking (Employee)
  ├── Access assigned assessment
  ├── View instructions
  ├── Answer questions
  │   ├── MCQ: Select option
  │   ├── T/F: Choose true/false
  │   ├── Descriptive: Write answer
  │   └── Practice: Upload proof
  ├── Submit assessment
  └── Status: SUBMITTED
  ↓
Assessment Evaluation
  ├── Auto-scoring
  │   ├── MCQ questions scored
  │   ├── T/F questions scored
  │   └── Initial score calculated
  │
  └── Manual Review (if needed)
      ├── Evaluate descriptive answers
      ├── Verify practice proofs
      ├── Add feedback comments
      └── Calculate final score
  ↓
Results & Feedback
  ├── Status: PASSED/FAILED
  ├── Score displayed
  ├── Feedback provided
  ├── Skill level updated
  ├── Certificate issued (if passed)
  └── [AUTO] Notifications sent
  ↓
Remedial Actions (if failed)
  ├── Identify weak areas
  ├── Recommend training
  ├── Allow retake
  └── Schedule follow-up
```

## 📊 Data Models & Relationships

### Core Entity Relationships

```
User (Central Entity)
  ├── Has many: SkillAssignments
  ├── Has many: AssessmentAssignments
  ├── Has many: TrainingAssignments
  ├── Has many: AssessmentResults
  ├── Has many: TrainingProgress
  ├── Has many: Feedback (given & received)
  ├── Has many: Notifications
  ├── Has one: EmployeeJourney
  ├── Reports to: User (manager)
  └── Manages: User[] (subordinates)

Skill
  ├── Has many: SkillAssignments
  ├── Belongs to: Category
  ├── Linked to: Assessments
  └── Linked to: Trainings

Assessment
  ├── Has many: Questions
  ├── Has many: Assignments
  ├── Has many: Results
  ├── Linked to: Skills
  └── Created by: User

Training
  ├── Has many: Assignments
  ├── Has many: Progress records
  ├── Has many: Proofs
  ├── Linked to: Skills
  ├── Created by: User (trainer)
  └── Type: ONLINE | OFFLINE

EmployeeJourney
  ├── Belongs to: User
  ├── Has many: Phases
  ├── Has many: Activities
  ├── Type: NEW_EMPLOYEE | EXISTING_EMPLOYEE
  └── Status: NOT_STARTED | IN_PROGRESS | COMPLETED | PAUSED

JourneyPhase
  ├── Belongs to: EmployeeJourney
  ├── Linked to: Assessment (optional)
  ├── Linked to: Training (optional)
  ├── Assigned to: Mentor (optional)
  └── Status: PENDING | IN_PROGRESS | COMPLETED | OVERDUE
```

## 🔐 Authentication & Security

## Project Structure

```
skillloop/
├── app/                    # Next.js app router pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility libraries
│   ├── db.ts            # Prisma database client
│   ├── prisma.ts        # Prisma client with adapter
│   └── utils.ts         # Helper functions
├── prisma/              # Database schema and migrations
│   ├── schema.prisma    # Database schema (19 models)
│   ├── seed.ts          # Database seeding script
│   └── migrations/      # Database migrations
├── Docs/                # Project documentation
└── Data/                # Seed data files
```

## Database Schema

The database consists of **19 models** covering:
- User management with hierarchical relationships
- Skills catalog and competency frameworks
- Assessments with multiple question types
- Training programs (online/offline)
- Progress tracking and attendance
- Feedback and notifications

See [prisma/README.md](prisma/README.md) for complete schema documentation.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
