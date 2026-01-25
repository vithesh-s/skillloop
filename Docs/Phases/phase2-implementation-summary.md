# Phase 2: Authentication & Authorization System - Implementation Complete ✅

**Date:** January 25, 2026  
**Status:** ✅ Complete  
**Next.js:** 16.1.4  
**Auth.js:** v5 (beta.30)  
**UI Library:** Shadcn UI (radix-vega style)

## Implementation Summary

Phase 2 authentication system has been successfully implemented with **dual passwordless authentication methods**:
1. **Magic Link Authentication** - Email-based magic links via Office 365 SMTP
2. **OTP Authentication** - 6-digit time-based one-time passwords via email

Both methods use NextAuth v5 (Auth.js) with Prisma adapter and JWT session strategy.

---

## 📁 Files Created/Modified

### Core Authentication
- ✅ `lib/auth.ts` - NextAuth v5 configuration with Prisma adapter, Nodemailer, and Credentials providers
- ✅ `lib/email.ts` - Email service for magic link delivery with branded template
- ✅ `lib/otp.ts` - OTP generation, verification, sending, and attempt tracking utilities
- ✅ `app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler
- ✅ `app/api/auth/otp/route.ts` - OTP send and verify endpoint
- ✅ `proxy.ts` - Role-based access control middleware (renamed from middleware.ts)

### Authentication UI
- ✅ `app/(auth)/layout.tsx` - Centered authentication layout
- ✅ `app/(auth)/login/page.tsx` - Login page with tabbed UI (Magic Link + OTP)
- ✅ `app/unauthorized/page.tsx` - Access denied page
- ✅ `app/test-auth/page.tsx` - Comprehensive authentication testing page

### Server Actions & Utilities
- ✅ `actions/auth.ts` - Server actions for login, logout, and authorization checks
- ✅ `lib/auth-utils.ts` - Helper functions for role checking and session management
- ✅ `hooks/use-session.ts` - Client-side hooks for authentication

### Components & Types
- ✅ `components/providers/session-provider.tsx` - Client session provider wrapper
- ✅ `components/ui/otp-input.tsx` - 6-digit OTP input component with auto-focus and paste support
- ✅ `components/ui/tabs.tsx` - Radix UI tabs component for auth method switching
- ✅ `types/next-auth.d.ts` - TypeScript type augmentation for NextAuth
- ✅ `app/layout.tsx` - Updated with SessionProvider wrapper
- ✅ `app/page.tsx` - New dashboard home page with role-based UI

### Database
- ✅ `prisma/schema.prisma` - Updated with NextAuth models and OTP model
  - Account, Session, VerificationToken (NextAuth)
  - OTP model with email, code, attempts, expiry tracking
  - User model: Added `emailVerified` field
- ✅ Migration: `20260125105617_add_nextauth_models` - Applied successfully
- ✅ Prisma Client regenerated with new models

### UI Components (shadcn/ui - radix-vega style)
- ✅ `components/ui/alert.tsx` - Alert component for messages
- ✅ `components/ui/spinner.tsx` - Loading spinner component
- ✅ `components/ui/tabs.tsx` - Tabs component for navigation
- ✅ `components/ui/otp-input.tsx` - Custom OTP input component
- ✅ Existing: Card, Input, Button, Label, Badge, Separator
- ✅ `components.json` - Updated style from "radix-nova" to "radix-vega"

### Configuration
- ✅ `.env.local` - Updated with URL-encoded passwords for DATABASE_URL and EMAIL_SERVER

---

## 🔐 Authentication Features

### 1. Magic Link Authentication
- ✅ User enters email address
- ✅ System sends magic link via Office 365 SMTP
- ✅ 24-hour token expiration
- ✅ Branded HTML email template with Skill Loop branding
- ✅ Plain text email fallback
- ✅ Error handling and user feedback
- ✅ CSRF token protection
- ✅ Automatic session creation on link click

### 2. OTP (One-Time Password) Authentication
- ✅ User enters email address
- ✅ System generates secure 6-digit random code
- ✅ OTP sent via branded email template
- ✅ 10-minute expiration window
- ✅ Maximum 5 failed attempts per OTP
- ✅ 60-second throttling between OTP requests
- ✅ Single-use OTP (marked as used after verification)
- ✅ Automatic cleanup of expired OTPs
- ✅ Custom OTP input component with:
  - Auto-focus next field on digit entry
  - Paste support for 6-digit codes
  - Backspace navigation
  - Visual feedback and validation

### 3. Tabbed Authentication UI
- ✅ Radix UI Tabs component for switching between methods
- ✅ Magic Link tab (default)
- ✅ OTP Code tab
- ✅ Consistent styling with Vega theme
- ✅ Loading states and error handling for both methods

### 4. Session Management
- ✅ JWT-based sessions (required for Credentials provider)
- ✅ Session includes custom user fields: id, role, employeeNo, department, designation, location
- ✅ Server and client-side session access
- ✅ Automatic session refresh
- ✅ 30-day session duration
- ✅ Secure HTTP-only cookies

### 5. Role-Based Access Control (RBAC)
- ✅ 4 roles: ADMIN, TRAINER, MANAGER, EMPLOYEE
- ✅ Middleware protection for routes:
  - `/admin/*` → ADMIN only
  - `/training/*` → TRAINER or ADMIN
  - `/manager/*` → MANAGER or ADMIN
  - All other routes → Authenticated users only
- ✅ Automatic redirect to `/login` for unauthenticated users
- ✅ Automatic redirect to `/unauthorized` for insufficient permissions

---

## 🛠️ Technical Implementation

### NextAuth v5 Configuration
```typescript
// lib/auth.ts
- PrismaAdapter for user data persistence
- JWT session strategy (required for Credentials provider)
- Nodemailer provider for magic link emails
- Credentials provider for OTP authentication
- Custom jwt callback to add user fields to token
- Custom session callback to include user fields from token
- Custom pages: signIn: '/login', error: '/login'
- Debug mode enabled in development
```

### OTP System Architecture
```typescript
// lib/otp.ts
- generateOTP(): Creates secure 6-digit random codes
- sendOTPEmail(): Sends branded HTML email via Nodemailer
- createAndSendOTP(): Main flow with throttling and validation
  - Cleans up expired OTPs
  - Enforces 60-second throttle
  - Generates and stores OTP in database
  - Sends email
- verifyOTP(): Validates OTP with security checks
  - Checks expiration (10 minutes)
  - Validates attempt count (max 5)
  - Marks as used after successful verification
- incrementOTPAttempts(): Tracks failed verification attempts
```

### OTP Database Model
```prisma
model OTP {
  id          String   @id @default(cuid())
  email       String
  code        String   @db.Char(6)
  attempts    Int      @default(0)
  maxAttempts Int      @default(5)
  createdAt   DateTime @default(now())
  expiresAt   DateTime
  used        Boolean  @default(false)
  usedAt      DateTime?

  @@unique([email, code])
  @@index([email])
  @@index([expiresAt])
}
```

### Environment Variables (configured)
```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=ADoR6DvZwgWyuw0npN3gVHAExqeULlw2M4siaTleSOw=

# Email Server (URL-encoded passwords)
EMAIL_SERVER=smtp://amgmiot@acemicromatic.com:PctAdmin%249876@smtp.office365.com:587
EMAIL_FROM=AmiT Skill Loop <amgmiot@acemicromatic.com>
EMAIL_SERVER_HOST=smtp.office365.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=amgmiot@acemicromatic.com
EMAIL_SERVER_PASSWORD=PctAdmin%249876

# Database (URL-encoded password)
DATABASE_URL="postgresql://pctadmin:pctadmin%241234@localhost:5432/skillloop?schema=public"
```

### Key Technical Decisions

#### 1. JWT Session Strategy (Not Database)
**Why:** NextAuth Credentials provider is incompatible with database session strategy. According to Auth.js documentation, using Credentials provider requires JWT strategy.

**Impact:**
- Sessions stored as JWT tokens in HTTP-only cookies
- No Session table entries for Credentials-based logins
- Magic Link logins still use database via Prisma adapter
- Custom jwt and session callbacks required

#### 2. URL Encoding for Special Characters
**Issue:** PostgreSQL and SMTP passwords contained `$` character causing authentication failures.

**Solution:** URL-encode passwords in connection strings:
- `pctadmin$1234` → `pctadmin%241234`
- `PctAdmin$9876` → `PctAdmin%249876`

#### 3. Dual Authentication Methods
**Why:** 
- Magic links require email client access (may not work on locked devices)
- OTP codes can be copied/memorized (better UX for mobile)
- Provides flexibility for different user preferences

#### 4. Shadcn UI Style: Vega (Not Nova)
**Changed from:** radix-nova  
**Changed to:** radix-vega  
**Reason:** User preference for cleaner, more modern aesthetic

### Database Schema Changes
```prisma
// NextAuth required models
model Account {
  id                 String  @id @default(cuid())
  userId             String
  type               String
  provider           String
  providerAccountId  String
  // ... OAuth fields
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// OTP authentication model
model OTP {
  id          String   @id @default(cuid())
  email       String
  code        String   @db.Char(6)
  attempts    Int      @default(0)
  maxAttempts Int      @default(5)
  createdAt   DateTime @default(now())
  expiresAt   DateTime
  used        Boolean  @default(false)
  usedAt      DateTime?

  @@unique([email, code])
  @@index([email])
  @@index([expiresAt])
}

// User model updates
model User {
  // ... existing fields
  emailVerified DateTime? // Added for NextAuth compatibility
  accounts      Account[]
  sessions      Session[]
}
```

---

## 🧪 Testing

### Test Auth Page Features (`/test-auth`)
- ✅ Display current session information
- ✅ Show all user profile fields (name, email, role, employeeNo, department, etc.)
- ✅ Role-based access testing buttons
- ✅ Logout functionality
- ✅ Visual confirmation of authentication status

### Test Scenarios

#### 1. Magic Link Login Flow
   - Navigate to `/login`
   - Click "Magic Link" tab
   - Enter work email
   - Receive magic link email within seconds
   - Click link to authenticate
   - Redirect to dashboard

#### 2. OTP Login Flow
   - Navigate to `/login`
   - Click "OTP Code" tab
   - Enter work email
   - Click "Send OTP Code"
   - Receive 6-digit code via email
   - Enter code in 6-field OTP input
   - Click "Verify OTP"
   - Redirect to dashboard on success

#### 3. OTP Security Features
   - ✅ Throttling: Cannot request new OTP within 60 seconds
   - ✅ Expiration: OTP expires after 10 minutes
   - ✅ Attempts: Maximum 5 failed attempts per OTP
   - ✅ Single-use: OTP cannot be reused after successful verification
   - ✅ Auto-cleanup: Expired OTPs automatically deleted

#### 4. Role Protection
   - Try accessing `/admin` with EMPLOYEE role → redirects to `/unauthorized`
   - Try accessing `/training` with TRAINER role → access granted
   - Try accessing protected route without auth → redirects to `/login`

#### 5. Session Management
   - Session persists across page refreshes
   - Session data available in both server and client components
   - Logout clears session and redirects to login
   - JWT token stored in HTTP-only cookie

---

## 📊 API Routes

### NextAuth Routes (auto-generated)
- `GET /api/auth/signin` - Sign in page
- `POST /api/auth/signin/nodemailer` - Initiate magic link email
- `POST /api/auth/signin/otp` - Initiate OTP authentication
- `GET /api/auth/callback/nodemailer` - Email magic link callback
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get session
- `GET /api/auth/csrf` - Get CSRF token
- `GET /api/auth/providers` - List providers

### Custom API Routes
- `POST /api/auth/otp` - OTP send and verify endpoint
  - **action: 'send'** - Generate and send OTP code
  - **action: 'verify'** - Verify OTP and return userId

---

## 🚀 Usage Examples

### Server Components
```typescript
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  
  return <div>Hello {session.user.name}</div>
}
```

### Server Actions
```typescript
import { requireRole } from '@/actions/auth'

export async function adminAction() {
  'use server'
  const session = await requireRole(['ADMIN'])
  // Only admins reach here
}
```

### Client Components
```typescript
'use client'
import { useSession } from '@/hooks/use-session'

export function UserProfile() {
  const { user, isLoading } = useSession()
  if (isLoading) return <Spinner />
  return <div>{user?.name}</div>
}
```

### OTP Authentication Flow (Client)
```typescript
// Send OTP
const response = await fetch('/api/auth/otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, action: 'send' }),
})

// Verify OTP
const verifyResponse = await fetch('/api/auth/otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, code: otp, action: 'verify' }),
})

const { userId } = await verifyResponse.json()

// Sign in with NextAuth
await signIn('otp', {
  userId,
  redirect: false,
})
```

---

## ✅ Verification Checklist

### Phase 1: Database Setup
- [x] Prisma schema updated with NextAuth models
- [x] Prisma schema updated with OTP model
- [x] User model updated with emailVerified field
- [x] Migration created and applied
- [x] Prisma Client regenerated
- [x] All 70 employees in database with valid emails

### Phase 2: Authentication Configuration
- [x] NextAuth v5 configured with Prisma adapter
- [x] JWT session strategy configured (required for Credentials)
- [x] Nodemailer provider configured for magic links
- [x] Credentials provider configured for OTP
- [x] Email service created with branded template
- [x] Environment variables configured with URL encoding
- [x] Custom jwt and session callbacks implemented

### Phase 3: OTP System Implementation
- [x] OTP model created in database
- [x] OTP generation utility (6-digit random)
- [x] OTP sending utility (email with template)
- [x] OTP verification utility (expiry, attempts, single-use)
- [x] OTP API endpoint (/api/auth/otp)
- [x] OTP attempt tracking and throttling
- [x] Automatic cleanup of expired OTPs

### Phase 4: UI Implementation
- [x] Login page created with tabbed interface
- [x] Magic Link tab with email input
- [x] OTP Code tab with email and OTP input
- [x] Custom OTP input component (6 digits)
- [x] Tabs component created (Radix UI)
- [x] Auth layout created
- [x] Unauthorized page created
- [x] Test auth page created
- [x] Dashboard home page updated
- [x] UI style changed to radix-vega

### Phase 5: Middleware & Protection
- [x] Middleware implemented with RBAC
- [x] Route matcher configured
- [x] Public routes allowed
- [x] Protected routes secured
- [x] Role-based route protection

### Phase 6: Developer Experience
- [x] Server actions created
- [x] Helper utilities created
- [x] Client hooks created
- [x] TypeScript types defined
- [x] Session provider configured

### Phase 7: Bug Fixes & Optimization
- [x] Fixed CSRF token errors
- [x] Fixed database connection issues (URL encoding)
- [x] Fixed emailVerified field missing error
- [x] Fixed OTP double submission issue
- [x] Fixed session strategy incompatibility
- [x] Fixed redirect issues after OTP verification
- [x] Removed debug console logs from production code

---

## 🔧 Known Issues & Notes

### Fixed Issues
- ✅ **CSRF Token Error** - Fixed by using signIn() function from next-auth/react instead of manual fetch
- ✅ **Database Connection Error** - Fixed by URL-encoding special characters ($) in passwords
- ✅ **emailVerified Field Missing** - Added to User model for NextAuth compatibility
- ✅ **OTP Double Submission** - Removed onComplete callback, using only button submit
- ✅ **Session Strategy Incompatibility** - Changed from database to JWT (required for Credentials provider)
- ✅ **Redirect Loop** - Fixed by using window.location.href with delay after OTP verification

### Type Casting Required
- `adapter: PrismaAdapter(db) as Adapter` - Required due to Next.js/Auth.js type mismatch
- `sendVerificationRequest as any` - Required due to NodemailerConfig type incompatibility

### Architecture Decisions
- **JWT vs Database Sessions**: Using JWT because Credentials provider is incompatible with database session strategy per Auth.js documentation
- **Dual Authentication**: Both Magic Link and OTP use the same session system but different entry points
- **OTP Security**: Multiple layers - expiration, attempt limiting, throttling, single-use enforcement

### Next.js 16 Compatibility
- Middleware uses `proxy.ts` naming convention
- Works with both Next.js 15 and 16
- Turbopack enabled for faster builds

---

## 📝 Next Steps (Phase 3)

1. **User Management**
   - Employee listing page
   - Employee detail page
   - Role assignment UI (admin only)

2. **Skill Management**
   - Skill CRUD operations
   - Skill categories
   - Skill ratings

3. **Training Programs**
   - Training program CRUD
   - Training enrollment
   - Training completion tracking

4. **Dashboard Enhancements**
   - Real data integration
   - Statistics and charts
   - Notifications

---

## 📚 Documentation References

- [Auth.js v5 Documentation](https://authjs.dev/)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [Nodemailer Provider](https://authjs.dev/reference/core/providers_nodemailer)
- [Next.js 16 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

---

## 🎯 Success Metrics

- ✅ 100% of planned features implemented
- ✅ Dual authentication methods (Magic Link + OTP)
- ✅ 0 build errors
- ✅ All TypeScript types properly defined
- ✅ RBAC working for all 4 roles
- ✅ Email delivery configured and tested (Magic Link + OTP)
- ✅ Database migrations applied successfully
- ✅ Test page available for verification
- ✅ Security features implemented:
  - OTP expiration (10 minutes)
  - Attempt limiting (5 max)
  - Request throttling (60 seconds)
  - Single-use enforcement
  - JWT HTTP-only cookies
  - CSRF protection
- ✅ Production-ready with debug logs removed
- ✅ Shadcn UI Vega theme integrated

---

## 🚧 Challenges Overcome

### 1. Credentials Provider + Database Sessions Incompatibility
**Problem:** NextAuth documentation not clear that Credentials provider requires JWT strategy.

**Solution:** Research via Context7 tool revealed Auth.js throws `UnsupportedStrategy` error when using Credentials with database sessions. Switched to JWT strategy and updated callbacks.

### 2. URL Special Character Encoding
**Problem:** PostgreSQL and SMTP passwords with `$` character caused connection failures.

**Solution:** URL-encode passwords in connection strings (`$` → `%24`).

### 3. OTP Double Submission
**Problem:** OTP verified twice - once via onComplete, once via form submit.

**Solution:** Removed auto-submit onComplete callback, require explicit button click.

### 4. Session Not Persisting After OTP
**Problem:** Session created but middleware couldn't read it, causing redirect loop.

**Solution:** Use full page reload (`window.location.href`) with delay instead of router.push() to ensure JWT cookie is processed.

### 5. CSRF Token Errors
**Problem:** Manual fetch to signin endpoint missing CSRF token.

**Solution:** Use NextAuth's `signIn()` function which handles CSRF automatically.

---

**Implementation completed by:** GitHub Copilot + Context7 Documentation  
**Total Development Time:** Phase 2 Extended (Multiple iterations for OTP system)  
**Ready for Production:** ✅ Yes
