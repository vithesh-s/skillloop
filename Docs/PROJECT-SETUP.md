# Skill Loop - Project Setup Guide

**Automated, Portable, Production-Ready Setup**

---

## Prerequisites

Before starting, ensure you have:

| Tool | Version | Check Command | Install Link |
|------|---------|---------------|--------------|
| **Node.js** | 20.10+ | `node --version` | https://nodejs.org |
| **npm** | 9+ | `npm --version` | Comes with Node.js |
| **Docker** | 20+ | `docker --version` | https://docker.com |
| **Docker Compose** | 2+ | `docker-compose --version` | Comes with Docker Desktop |
| **Git** | 2+ | `git --version` | https://git-scm.com |

---

## Quick Start (Automated Setup)

### Option 1: Unix/macOS/Linux

```bash
# Clone repository
git clone <your-repo-url> skill-loop
cd skill-loop

# Run automated setup
chmod +x scripts/setup.sh
./scripts/setup.sh

# App will be running at http://localhost:3000
```

### Option 2: Windows PowerShell

```powershell
# Clone repository
git clone <your-repo-url> skill-loop
cd skill-loop

# Run automated setup
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup.ps1

# App will be running at http://localhost:3000
```

---

## Manual Setup (Step-by-Step)

### Step 1: Create Project with shadcn Preset

```bash
# Use shadcn CLI with custom preset
npx shadcn@latest create \
  --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=gray&theme=emerald&iconLibrary=remixicon&font=public-sans&menuAccent=bold&menuColor=default&radius=medium&template=next" \
  --template next \
  --name skill-loop

cd skill-loop
```

**What this does:**
- Creates Next.js 16.1.1 project with App Router
- Installs shadcn/ui with Nova style
- Sets emerald theme (primary color)
- Configures Remix Icon library
- Sets Public Sans font
- Configures Tailwind CSS v4
- Includes latest Form component, cacheLife API, cacheTag API

---

### Step 2: Install Dependencies

```bash
# Core dependencies
npm install prisma @prisma/client

# Authentication (Auth.js v5)
npm install next-auth@beta

# Email (Office 365 SMTP / Gmail)
npm install nodemailer
npm install -D @types/nodemailer

# File upload
npm install uploadthing @uploadthing/react

# Charts & Visualization
npm install recharts

# PDF generation
npm install react-pdf jspdf

# Development dependencies
npm install -D @types/node typescript

# shadcn/ui components (will be added as needed)
npx shadcn@latest add button card input form select table dialog dropdown-menu
```

---

### Step 3: Setup PostgreSQL with Docker

Create `docker-compose.yml` in project root:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    container_name: skillloop-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: skillloop
      POSTGRES_PASSWORD: skillloop_dev_password
      POSTGRES_DB: skillloop_db
      TZ: Asia/Kolkata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U skillloop -d skillloop_db"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - skillloop-network

volumes:
  postgres_data:
    driver: local

networks:
  skillloop-network:
    driver: bridge
```

Start database:

```bash
docker-compose up -d
```

**Access Database:**
Use **Prisma Studio** (recommended) for database management:
```bash
npx prisma studio
```
Opens at http://localhost:5555

**Direct Connection Details:**
- Host: `localhost`
- Port: `5432`
- Database: `skillloop_db`
- User: `skillloop`
- Password: `skillloop_dev_password`

---

### Step 4: Configure Environment Variables

Create `.env.local` in project root:

```bash
# Database (Note: URL-encode special characters like $ as %24)
DATABASE_URL="postgresql://skillloop:pctadmin%241234@localhost:5432/skillloop_db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here-generate-with-openssl"

# Email Configuration (Office 365 SMTP)
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="your-email@acemicromatic.com"
SMTP_PASSWORD="your-password-here"
SMTP_FROM="your-email@acemicromatic.com"
SMTP_FROM_NAME="Skill Loop"

# UploadThing (File Upload)
UPLOADTHING_SECRET="sk_live_your_secret_here"
UPLOADTHING_APP_ID="your_app_id_here"
```

**Generate NEXTAUTH_SECRET:**
```bash
# Unix/macOS
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Configure Office 365 Email:**
1. Use your corporate Office 365 email credentials
2. SMTP Host: `smtp.office365.com`
3. SMTP Port: `587`
4. For personal email (Gmail), see the Gmail SMTP setup guide

**Get UploadThing Credentials:**
1. Sign up at https://uploadthing.com
2. Create new app
3. Copy Secret and App ID
4. Free tier: 2GB storage

---

### Step 5: Setup Prisma

Initialize Prisma:

```bash
npx prisma init
```

This will be created for you, then replace the contents of `prisma/schema.prisma` with the complete schema (see implementation plan for full schema).

**Key schema excerpt:**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  employeeNo    String   @unique
  name          String
  email         String   @unique
  role          Role     @default(EMPLOYEE)
  department    String
  designation   String
  location      String
  dateOfJoining DateTime
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  skillMatrices     SkillMatrix[]
  trainingAssignments TrainingAssignment[]
  // ... more relations
}

enum Role {
  ADMIN
  TRAINER
  EMPLOYEE
  MANAGER
}

// ... 14 more models
```

---

### Step 6: Run Migrations

```bash
# Create and apply initial migration
npx prisma migrate dev --name init

# This will:
# 1. Create migration files
# 2. Apply migration to database
# 3. Generate Prisma Client
```

Verify in pgAdmin:
- Database should have all 15 tables
- Check schema in public namespace

---

### Step 7: Seed Database

Create `prisma/seed.ts`:

```typescript
import { PrismaClient, Role } from '@prisma/client'
import { hash } from 'bcrypt'
import employeeData from '../Data/Exsisting-employee-dataoseed.json'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Skills
  const skills = await Promise.all([
    prisma.skill.create({ data: { name: 'React', category: 'Technical', description: 'Frontend library' } }),
    prisma.skill.create({ data: { name: 'Node.js', category: 'Technical', description: 'Backend runtime' } }),
    prisma.skill.create({ data: { name: 'TypeScript', category: 'Technical', description: 'Type-safe JavaScript' } }),
    prisma.skill.create({ data: { name: 'PostgreSQL', category: 'Technical', description: 'Relational database' } }),
    prisma.skill.create({ data: { name: 'Testing', category: 'Technical', description: 'Unit & E2E testing' } }),
    prisma.skill.create({ data: { name: 'Communication', category: 'Soft', description: 'Effective communication' } }),
    prisma.skill.create({ data: { name: 'Leadership', category: 'Soft', description: 'Team leadership' } }),
    prisma.skill.create({ data: { name: 'Domain Knowledge', category: 'Domain', description: 'Industry expertise' } }),
  ])

  // Seed Users from employee JSON
  const employees = employeeData.data || []
  
  for (const emp of employees) {
    await prisma.user.create({
      data: {
        employeeNo: emp.employeeNo,
        name: emp.name,
        email: emp.email,
        role: determineRole(emp), // Logic to assign roles
        department: emp.department,
        designation: emp.designation,
        location: emp.location,
        dateOfJoining: new Date(emp.dateOfJoining || '2024-01-01'),
        active: !emp.resigned,
      }
    })
  }

  console.log(`✅ Seeded ${employees.length} employees`)

  // Seed Assessments with Questions
  const reactAssessment = await prisma.assessment.create({
    data: {
      title: 'React Fundamentals',
      skillId: skills[0].id,
      totalMarks: 100,
      passingScore: 60,
      duration: 30,
      type: 'Initial',
    }
  })

  await prisma.question.createMany({
    data: [
      {
        assessmentId: reactAssessment.id,
        questionText: 'What is a React Hook?',
        questionType: 'MCQ',
        options: JSON.stringify(['A function', 'A component', 'A library', 'A framework']),
        correctAnswer: 'A function',
        marks: 10,
        difficulty: 'Beginner',
      },
      // ... 9 more questions
    ]
  })

  console.log('✅ Seeded assessments and questions')

  // Seed Training Topics
  await prisma.trainingTopic.createMany({
    data: [
      {
        name: 'React Advanced Patterns',
        description: 'Advanced React concepts and patterns',
        skillId: skills[0].id,
        type: 'Online',
        estimatedDuration: 40,
        resources: JSON.stringify([
          { type: 'video', url: 'https://www.udemy.com/course/react-advanced', title: 'React Advanced Course' }
        ])
      },
      //... more training topics
    ]
  })

  console.log('✅ Seeded training topics')
  console.log('🎉 Database seeding complete!')
}

function determineRole(emp: any): Role {
  if (emp.designation.includes('Director') || emp.designation.includes('Managing')) return 'ADMIN'
  if (emp.designation.includes('Manager')) return 'MANAGER'
  if (emp.designation.includes('Team Lead') || emp.designation.includes('Principal')) return 'TRAINER'
  return 'EMPLOYEE'
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Update `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run seed:

```bash
npm install -D ts-node
npx prisma db seed
```

---

### Step 8: Configure Next.js

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // For file uploads
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io', // UploadThing CDN
      },
    ],
  },
}

module.exports = nextConfig
```

---

### Step 9: Setup TypeScript Paths

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

### Step 10: Create Automation Scripts

**Unix Setup Script** (`scripts/setup.sh`):

```bash
#!/bin/bash
set -e

echo "🚀 Skill Loop - Automated Setup"
echo "================================"

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Install from https://docker.com"
    exit 1
fi

echo "✅ Prerequisites met"

# Install dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# Environment setup
echo ""
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "⚠️  IMPORTANT: Update .env.local with your API keys:"
    echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
    echo "   - SMTP_USER, SMTP_PASSWORD (your Office 365 credentials)"
    echo "   - UPLOADTHING_SECRET & UPLOADTHING_APP_ID (from https://uploadthing.com)"
    echo ""
    read -p "Press Enter when you've updated .env.local..."
fi

# Start Docker database
echo ""
echo "🐘 Starting PostgreSQL with Docker..."
docker-compose down
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

until docker exec skillloop-db pg_isready -U skillloop > /dev/null 2>&1; do
  echo "   Still waiting for database..."
  sleep 2
done

echo "✅ Database is ready"

# Run Prisma migrations
echo ""
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma Client
echo ""
echo "⚙️  Generating Prisma Client..."
npx prisma generate

# Seed database
echo ""
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo ""
echo "✅ SETUP COMPLETE!"
echo "================================"
echo ""
echo "📊 Database Access:"
echo "   • PostgreSQL: localhost:5432"
echo "   • Prisma Studio: npx prisma studio"
echo "     Opens at http://localhost:5555"
echo ""
echo "🚀 Start development server:"
echo "   npm run dev"
echo ""
echo "🌐 Application will be at: http://localhost:3000"
echo ""
echo "📖 Demo Credentials: See DEMO-CREDENTIALS.md"
echo ""
```

**Windows Setup Script** (`scripts/setup.ps1`):

```powershell
Write-Host "🚀 Skill Loop - Automated Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker not found. Install from https://docker.com" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites met" -ForegroundColor Green

# Install dependencies
Write-Host "`n📦 Installing npm dependencies..." -ForegroundColor Cyan
npm install

# Environment setup
if (-not (Test-Path .env.local)) {
    Write-Host "`n📝 Creating .env.local from template..." -ForegroundColor Cyan
    Copy-Item .env.example .env.local
    Write-Host "⚠️  IMPORTANT: Update .env.local with your API keys:" -ForegroundColor Yellow
    Write-Host "   - NEXTAUTH_SECRET (generate with PowerShell below)" -ForegroundColor Yellow
    Write-Host "   -SMTP_USER, SMTP_PASSWORD (your Office 365 credentials)" -ForegroundColor Yellow
    Write-Host "   - UPLOADTHING_SECRET & UPLOADTHING_APP_ID (from https://uploadthing.com)" -ForegroundColor Yellow
    Write-Host "`nGenerate NEXTAUTH_SECRET:" -ForegroundColor Yellow
    $secret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
    Write-Host "NEXTAUTH_SECRET=$secret" -ForegroundColor White
    Write-Host "`nPress Enter when you've updated .env.local..." -ForegroundColor Yellow
    Read-Host
}

# Start Docker database
Write-Host "`n🐘 Starting PostgreSQL with Docker..." -ForegroundColor Cyan
docker-compose down
docker-compose up -d

# Wait for database
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

$retries = 0
while ($retries -lt 30) {
    $result = docker exec skillloop-db pg_isready -U skillloop 2>&1
    if ($LASTEXITCODE -eq 0) {
        break
    }
    Write-Host "   Still waiting for database..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
    $retries++
}

Write-Host "✅ Database is ready" -ForegroundColor Green

# Run Prisma migrations
Write-Host "`n🔄 Running database migrations..." -ForegroundColor Cyan
npx prisma migrate deploy

# Generate Prisma Client
Write-Host "`n⚙️  Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# Seed database
Write-Host "`n🌱 Seeding database with initial data..." -ForegroundColor Cyan
npx prisma db seed

Write-Host "`n✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "`n📊 Database Access:" -ForegroundColor Cyan
Write-Host "   • PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host "   • Prisma Studio: npx prisma studio" -ForegroundColor White
Write-Host "     Opens at http://localhost:5555" -ForegroundColor Gray
Write-Host "`n🚀 Start development server:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "`n🌐 Application will be at:" -ForegroundColor Cyan
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host "`n📖 Demo Credentials: See DEMO-CREDENTIALS.md" -ForegroundColor Cyan
Write-Host ""
```

Make scripts executable:

```bash
# Unix
chmod +x scripts/setup.sh

# Windows (run PowerShell as Admin)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Development Workflow

### Starting the Application

```bash
# Start database (if not running)
docker-compose up -d

# Start development server
npm run dev
```

**Access application:** http://localhost:3000

### Stopping the Application

```bash
# Stop dev server: Ctrl+C

# Stop database
docker-compose down

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v
```

---

## Database Management

### View Database

```bash
# Prisma Studio (Recommended)
npx prisma studio
# Opens at http://localhost:5555
# - Visual data browser
# - Edit records directly
# - Understanding schema relations
```

### Reset Database

```bash
# CAUTION: This deletes all data!
npx prisma migrate reset
# This will:
# 1. Drop database
# 2. Create database
# 3. Run all migrations
# 4. Run seed script
```

### Create New Migration

```bash
# After changing schema.prisma
npx prisma migrate dev --name your_migration_name
```

### Remove Demo Data

```bash
# Run cleanup script
npm run cleanup-demo

# Or manually
npx ts-node scripts/cleanup-demo.ts
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 5432 already allocated`

**Solution:**
```bash
# Find process using port
# Unix/macOS
lsof -i :5432

# Windows
netstat -ano | findstr :5432

# Kill process or change port in docker-compose.yml
```

### Prisma Client Not Generated

**Error:** `@prisma/client not found`

**Solution:**
```bash
npx prisma generate
```

### Database Connection Failed

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check Docker is running
docker ps

# Restart database
docker-compose restart postgres

# Check logs
docker logs skillloop-db
```

### Email OTP Not Sending

**Check:**
1. `SMTP_USER` and `SMTP_PASSWORD` are correct in `.env.local`
2. Office 365 SMTP host and port configured correctly
3. Check email server logs or delivery status
4. Verify firewall allows outbound connections on port 587

### File Upload Failing

**Check:**
1. `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` correct
2. Route handler exists at `app/api/uploadthing/route.ts`
3. File size under limit (10MB)
4. Allowed file types configured

---

## Production Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Environment Variables (Vercel Dashboard):**
- `DATABASE_URL` - Use production PostgreSQL (Neon, Supabase, etc.)
- `NEXTAUTH_URL` - Your production domain
- `NEXTAUTH_SECRET` - Same secret as development
- `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_HOST` - Production email credentials
- `UPLOADTHING_SECRET` - Production secret
- `UPLOADTHING_APP_ID` - Production app ID

### Production Database Options

| Provider | Free Tier | Setup |
|----------|-----------|-------|
| **Neon** | 500MB | https://neon.tech |
| **Supabase** | 500MB | https://supabase.com |
| **Railway** | $5/month | https://railway.app |
| **Render** | 90 days free | https://render.com |

Update `DATABASE_URL` in `.env.local` or Vercel dashboard.

---

## CI/CD Integration

  ### GitHub Actions (.github/workflows/ci.yml)

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: skillloop
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: skillloop_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://skillloop:test_password@localhost:5432/skillloop_test

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://skillloop:test_password@localhost:5432/skillloop_test

      - name: Build
        run: npm run build
```

---

## Backup & Restore

### Backup Database

```bash
# Using pg_dump
docker exec skillloop-db pg_dump -U skillloop skillloop_db > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Uncompress if needed
gunzip backup_20260125.sql.gz

# Restore
docker exec -i skillloop-db psql -U skillloop skillloop_db < backup_20260125.sql
```

---

## Summary

**What You Now Have:**
- ✅ Next.js 15 with shadcn/ui (Nova preset, emerald theme)
- ✅ PostgreSQL in Docker (portable, version-controlled)
- ✅ Prisma ORM (type-safe, migrations managed)
- ✅ Automated setup scripts (Unix & Windows)
- ✅ Email OTP ready (Office 365 SMTP)
- ✅ File uploads ready (UploadThing)
- ✅ 70+ employees seeded
- ✅ Demo data easily removable

**Next Steps:**
1. Review [skill-loop-mvp.md](./skill-loop-mvp.md) for implementation phases
2. Start with Phase 1: Foundation & Setup
3. Follow task dependencies for efficient parallel work
4. Demo preparation on Day 2 evening

**Support:**
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs
- shadcn/ui Docs: https://ui.shadcn.com
- nodemailer Docs: https://nodemailer.com
- UploadThing Docs: https://docs.uploadthing.com

---

**Setup Complete! Ready to build. 🚀**
