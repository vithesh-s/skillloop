# Latest Versions & Dependencies

**Last Updated:** 2026-01-25 (via Context7 MCP)

---

## Core Stack (Latest Stable Versions)

| Package | Version | Notes |
|---------|---------|-------|
| **Next.js** | 16.1.4 | Latest stable with Form component, cacheLife, cacheTag APIs |
| **React** | 19.2.3 | Comes with Next.js 16 |
| **Node.js** | 20.10+ | LTS requirement |
| **TypeScript** | 5+ | Latest |
| **Prisma** | 7.3.0 | Latest ORM with PostgreSQL optimizations |
| **PostgreSQL** | 16-alpine | Docker image |

---

## Authentication & Security

| Package | Version | Installation |
|---------|---------|--------------|
| **Auth.js (NextAuth.js)** | 5.0.0-beta.30 | `npm install next-auth@beta` |
| **Prisma Adapter** | 2.11.1 | `npm install @auth/prisma-adapter` |

**Config Example (Latest Auth.js v5):**
```typescript
// lib/auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Configure your auth providers here
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
      },
      authorize: async (credentials) => {
        // Implement your auth logic
        return null
      },
    }),
  ],
})
```

---

## UI & Styling

| Package | Version | Installation |
|---------|---------|--------------|
| **shadcn/ui** | Latest | Via preset command |
| **Tailwind CSS** | v4 | Comes with shadcn preset |
| **Radix UI** | Latest | Dependency of shadcn |
| **Remix Icon** | Latest | Via shadcn config |
| **Public Sans** | Latest | Google Fonts |

**shadcn Preset Command:**
```bash
npx shadcn@latest create \
  --preset "https://ui.shadcn.com/init?base=radix&style=nova&baseColor=gray&theme=emerald&iconLibrary=remixicon&font=public-sans&menuAccent=bold&menuColor=default&radius=medium&template=next" \
  --template next \
  --name skill-loop
```

---

## Database & ORM

| Package | Version | Installation |
|---------|---------|--------------|
| **Prisma Client** | 7.3.0 | `npm install @prisma/client@latest` |
| **Prisma CLI** | 7.3.0 | `npm install prisma@latest` |

**Latest Prisma Config (from Context7):**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Example model with latest features
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  role          Role     @default(EMPLOYEE)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relations
  accounts      Account[]
  sessions      Session[]
}
```



## Email & Communication

| Package | Version | Installation |
|---------|---------|--------------|
| **nodemailer** | 7.0.12 | `npm install nodemailer` |
| **@types/nodemailer** | 7.0.5 | `npm install -D @types/nodemailer` |

**Usage (Office 365 SMTP):**
```typescript
// lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendOTP(email: string, otp: string) {
  await transporter.sendMail({
    from: `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Your Login Code',
    html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
  })
}
```

---

## File Upload

| Package | Version | Installation |
|---------|---------|--------------|
| **UploadThing** | 7.7.4 / 7.3.3 (React) | `npm install uploadthing @uploadthing/react` |

**Setup (Latest UploadThing):**
```typescript
// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  proofUploader: f({ pdf: { maxFileSize: "10MB" } })
    .middleware(async ({ req }) => {
      const user = await auth()
      if (!user) throw new Error("Unauthorized")
      return { userId: user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId)
      console.log("file url", file.url)
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

---

## Charts & Visualization

| Package | Version | Installation |
|---------|---------|--------------|
| **Recharts** | 3.7.0 | `npm install recharts@latest` |
| **@react-pdf/renderer** | 4.3.2 | `npm install @react-pdf/renderer` |
| **jsPDF** | 4.0.0 | `npm install jspdf@latest` |

---

## Docker (Production-Ready)

**PostgreSQL Docker Compose:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: skillloop-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: skillloop
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
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

volumes:
  postgres_data:
```

---

## Next.js 16.1.1 New Features (from Context7)

### 1. Form Component (Stable)
```typescript
import Form from "next/form";

export default function LoginForm() {
  async function handleLogin(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    // Process login
  }

  return (
    <Form action={handleLogin}>
      <input name="email" type="email" required />
      <button type="submit">Login</button>
    </Form>
  );
}
```

### 2. cacheLife API (New)
```typescript
import { unstable_cacheLife as cacheLife } from 'next/cache'

export async function getUsers() {
  cacheLife('hours') // Predefined profiles: seconds, minutes, hours, days, weeks, max
  const users = await prisma.user.findMany()
  return users
}
```

### 3. cacheTag API (New)
```typescript
import { unstable_cacheTag as cacheTag } from 'next/cache'

export async function getUser(id: string) {
  cacheTag('user', `user-${id}`)
  return await prisma.user.findUnique({ where: { id } })
}
```

### 4. Enhanced Server Actions
```typescript
"use server"

import { revalidateTag } from 'next/cache'

export async function updateUser(id: string, data: any) {
  await prisma.user.update({ where: { id }, data })
  revalidateTag(`user-${id}`) // Invalidate cacheTag
  return { success: true }
}
```

---

## Development Commands (Latest)

```bash
# Install dependencies
npm install

# Database setup
docker-compose up -d
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed

# Development
npm run dev

# Build
npm run build

# Production
npm start

# Database tools
npx prisma studio           # GUI for database
npx prisma migrate reset    # Reset database (CAUTION)
```

---

## Environment Variables (Complete)

```bash
# Database
DATABASE_URL="postgresql://skillloop:password@localhost:5432/skillloop_db"

# Auth.js v5
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Email (Office 365 SMTP)
SMTP_HOST="smtp.office365.com"
SMTP_PORT="587"
SMTP_USER="your-email@acemicromatic.com"
SMTP_PASSWORD="your-password"
SMTP_FROM="your-email@acemicromatic.com"
SMTP_FROM_NAME="Skill Loop"

# UploadThing
UPLOADTHING_SECRET="sk_live_your_secret"
UPLOADTHING_APP_ID="your_app_id"

# Node Environment
NODE_ENV="development"
```

---

## Best Practices (from Context7 Docs)

### 1. Server Actions over API Routes
✅ **DO:**
```typescript
// app/actions/users.ts
"use server"

export async function createUser(data: FormData) {
  const user = await prisma.user.create({
    data: {
      name: data.get("name") as string,
      email: data.get("email") as string,
    }
  })
  return user
}
```

❌ **DON'T:**
```typescript
// app/api/users/route.ts (avoid API routes for simple CRUD)
export async function POST(request: Request) {
  const body = await request.json()
  // ... more boilerplate
}
```

### 2. Prisma Client Singleton
✅ **Correct:**
```typescript
// lib/db.ts
const globalForPrisma = global as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3. Server Components by Default
✅ **Prefer:**
```typescript
// app/users/page.tsx (Server Component)
import { prisma } from '@/lib/db'

export default async function UsersPage() {
  const users = await prisma.user.findMany()
  return <UserList users={users} />
}
```

---

## Verification Checklist

- [ ] Node.js 20.10+ installed
- [ ] Docker running
- [ ] All environment variables set
- [ ] Prisma migrations applied
- [ ] Database seeded
- [ ] Dev server starts without errors
- [ ] Auth flow works (email OTP)
- [ ] File upload works
- [ ] All dashboards accessible

---

**All versions verified via Context7 MCP on 2026-01-25**

**Ready to build!** 🚀
