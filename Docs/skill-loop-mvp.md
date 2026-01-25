# Skill Loop MVP - Implementation Plan

## Overview

**Project:** Skill Loop - Learning & Development Management System  
**Timeline:** 2 Days (Hackathon)  
**Objective:** demonstrating all 4 user personas (Admin, Trainer, Employee, Manager)

### Success Criteria
- ✅ Complete end-to-end training workflow (Assessment → Training → Progress → Proof → Re-assessment)
- ✅ All 4 personas fully functional with dedicated dashboards
- ✅ Email OTP authentication working
- ✅ Full assessment engine (MCQ + auto-grading)
- ✅ Skill matrix visualization (heat maps)
- ✅ PostgreSQL in Docker (portable setup)
- ✅ Automated setup scripts (run anywhere)
- ✅ Minimal email notifications (1-2 types) demonstrating system capability

---

## Project Type

**WEB APPLICATION** - Next.js 16 full-stack application

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 16.1.4 (App Router) | Form component, Server Components, Server Actions, cacheLife/cacheTag APIs |
| **UI Library** | shadcn/ui (Nova preset) | Pre-built accessible components, fast development |
| **Styling** | Tailwind CSS v4 | Utility-first, emerald theme, consistent design |
| **Backend** | Next.js Server Actions | Type-safe, no REST API needed, simplified architecture |
| **Database** | PostgreSQL 16 (Docker) | Relational data, ACID compliance, portable |
| **ORM** | Prisma 7.3.0 | Type-safe queries, migrations, great DX |
| **Authentication** | Auth.js (NextAuth.js v5.0.0-beta.30) | Email OTP, session management, RBAC |
| **Email** | nodemailer 7.0.12 | Office 365 SMTP, free for corporate accounts |
| **File Upload** | UploadThing 7.7.4 | S3-backed, easy integration |
| **Charts** | Recharts 3.7.0 | Heat maps, bar charts for skill matrix |
| **PDF Reports** | @react-pdf/renderer 4.3.2 + jsPDF 4.0.0 | Export training reports |
| **Icons** | Remix Icon 4.8.0 | Consistent icon library |
| **Fonts** | Public Sans | Clean, professional typography |

---

## File Structure

```
skill-loop/
├── .env.local                    # Environment variables (not committed)
├── .env.example                  # Environment template
├── docker-compose.yml           # PostgreSQL + pgAdmin setup
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Seed data script
│   └── migrations/              # Migration history
├── scripts/
│   ├── setup.sh                 # Automated setup (Unix)
│   ├── setup.ps1                # Automated setup (Windows)
│   ├── seed-demo-data.ts        # Additional demo data
│   └── cleanup-demo.ts          # Remove demo data
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Landing page
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx    # Email OTP login
│   │   │   └── verify-otp/
│   │   │       └── page.tsx    # OTP verification
│   │   ........
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config
│   │   ├── db.ts               # Prisma client
│   │   ├── email.ts            # nodemailer email functions
│   │   ├── uploadthing.ts      # File upload config
│   │   └── utils.ts            # Utility functions
│   ├── actions/
│   │   ├── auth.ts             # Auth server actions
│   │   ├── users.ts            # User management
│   │   ├── assessments.ts      # Assessment CRUD
│   │   ├── trainings.ts        # Training management
│   │   ├── progress.ts         # Progress tracking
│   │   ├── proofs.ts           # Proof upload/approval
│   │   ├── skill-matrix.ts     # Skill gap calculations
│   │   └── notifications.ts    # Email notifications
│   ├── types/
│   │   ├── index.ts            # Shared TypeScript types
│   │   └── enums.ts            # Enums (roles, statuses)
│   └── middleware.ts           # Auth + RBAC middleware
└── public/
    └── fonts/                  # Public Sans font files
```

---

## Database Schema

15 core tables (see `prisma/schema.prisma`):

1. `User` - Employee accounts
2. `Skill` - Skills catalog
3. `Assessment` - Assessment metadata
4. `Question` - Question bank
5. `AssessmentResult` - Test results
6. `SkillMatrix` - Employee skill levels
7. `TrainingTopic` - Training courses
8. `TrainingAssignment` - Assigned trainings
9. `TrainingProgress` - Weekly updates
10. `CompletionProof` - Uploaded certificates
11. `Feedback` - Post-training feedback
12. `Notification` - Email log
13. `TrainingCalendar` - Scheduled sessions
14. `Attendance` - Session attendance
15. `TNA` - Training Need Analysis

---

## Phase Breakdown

### Phase 1: Foundation & Setup (4 hours)

**Agent:** `backend-specialist` + `security-auditor`  
**Skills:** `nodejs-best-practices`, `database-design`

#### Tasks

**T1.1: Project Initialization**
- **INPUT:** User requirements, tech stack decisions
- **OUTPUT:** Next.js project with shadcn preset, dependencies installed
- **VERIFY:** `npm run dev` starts without errors
- **Dependencies:** None
- **Parallel:** No (foundation task)

```bash
# Command
npx sh@latest create --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=gray&theme=emerald&iconLibrary=remixicon&font=public-sans&menuAccent=bold&menuColor=default&radius=medium&template=next" --template next --name skill-loop

cd skill-loop
npm install prisma @prisma/client next-auth@beta nodemailer uploadthing @uploadthing/react recharts  react-pdf jspdf
npm install -D @types/nodemailer
```

---

**T1.2: Docker PostgreSQL Setup**
- **INPUT:** Database requirements
- **OUTPUT:** `docker-compose.yml` with PostgreSQL + pgAdmin
- **VERIFY:** `docker-compose up -d` starts database, connects on port 5432
- **Dependencies:** None
- **Parallel:** Yes (can run with T1.1)

**File:** `docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: skillloop-db
    environment:
      POSTGRES_USER: skillloop
      POSTGRES_PASSWORD: skillloop_dev_password
      POSTGRES_DB: skillloop_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U skillloop"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: skillloop-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@skillloop.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

**T1.3: Prisma Schema Design**
- **INPUT:** PRD database requirements (15 tables)
- **OUTPUT:** `prisma/schema.prisma` with complete schema
- **VERIFY:** `npx prisma validate` passes, `npx prisma generate` creates client
- **Dependencies:** T1.2 (database running)
- **Parallel:** No (schema needed for migrations)

---

**T1.4: Database Migrations**
- **INPUT:** Prisma schema
- **OUTPUT:** Initial migration applied, database tables created
- **VERIFY:** `npx prisma studio` shows all 15 tables
- **Dependencies:** T1.3
- **Parallel:** No

```bash
npx prisma migrate dev --name init
```

---

**T1.5: Seed Data Script**
- **INPUT:** Employee JSON file (`Data/Exsisting-employee-dataoseed.json`)
- **OUTPUT:** `prisma/seed.ts` that imports 70+ employees + demo data
- **VERIFY:** `npx prisma db seed` completes, 70+ users in database
- **Dependencies:** T1.4
- **Parallel:** No

**Seed data includes:**
- 70+ real employees (from provided JSON)
more seeding we add as we develop

---

### Phase 2: Authentication & Security (3 hours)

**Agent:** `security-auditor`  
**Skills:** `vulnerability-scanner`, `clean-code`

#### Tasks

**T2.1: NextAuth.js Setup**
- **INPUT:** Email OTP requirement
- **OUTPUT:** `lib/auth.ts` with NextAuth config, email provider
- **VERIFY:** Auth pages accessible at `/login`
- **Dependencies:** T1.4 (User table exists)
- **Parallel:** Yes (with T1.5 seed script)

---

**T2.2: Email OTP Implementation**
- **INPUT:** Office 365 SMTP credentials
- **OUTPUT:** `lib/email.ts` with OTP generation, sending, verification
- **VERIFY:** Send test OTP, verify code works
- **Dependencies:** T2.1
- **Parallel:** No

**Features:**
- 6-digit OTP generation
- 5-minute expiry
- Rate limiting (3 attempts per 15 minutes)
- Office 365 email delivery

---

**T2.3: RBAC Middleware**
- **INPUT:** User roles (Admin, Trainer, Employee, Manager)
- **OUTPUT:** `middleware.ts` with route protection by role
- **VERIFY:** Accessing `/admin` as Employee redirects to `/employee`
- **Dependencies:** T2.1
- **Parallel:** Yes (with T2.2)

**Protected routes:**
- `/admin/*` → Admin only
- `/trainer/*` → Trainer only
- `/employee/*` → Employee only
- `/manager/*` → Manager only

---
more has to be writen as the project goe s on
