# Skill Loop - Agent Brain (Knowledge Base)

**Central knowledge repository for all agents working on Skill Loop**

---

## 🧠 Purpose

This document serves as the **single source of truth** for all agents. Every agent must read this before starting work to understand the project context, locate documentation, and follow established patterns.

---

## 📋 Project Overview

**Name:** Skill Loop  
**Type:** Learning & Development Management System (LMS)  
**Timeline:** 2-day hackathon MVP  
**Tech Stack:** Next.js 16.1.1 + Prisma 6.19.2 + PostgreSQL + Auth.js v5  
**Goal:** 80%+ feature coverage with all 4 user personas (Admin, Trainer, Employee, Manager)

---

## 📁 Document Organization

### Core Planning Documents

| Document | Location | Purpose | When to Read |
|----------|----------|---------|--------------|
| **PRD** | `Docs/skillloop_prd.md` | Complete product requirements (1270 lines) | Before any feature work |
| **Implementation Plan** | `skill-loop-mvp.md` 
| **Project Setup** | `PROJECT-SETUP.md` | Automated setup, Docker, commands | Environment setup |
| **Latest Versions** | `LATEST-VERSIONS.md` | Current tech stack versions, examples | Before installing deps |
| **Agent Brain** | `AGENT-BRAIN.md` | This file - central knowledge | First thing to read |

### Strategy Documents (Brain Artifacts)

| Document | Location | Purpose |
|----------|----------|---------|
| **Hackathon Analysis** | `C:\Users\Devteam\.gemini\antigravity\brain\...\hackathon_analysis.md` | Initial strategic analysis |
| **Parallel Agent Plan** | `C:\Users\Devteam\.gemini\antigravity\brain\...\parallel_agent_plan.md` | Multi-agent coordination |
| **Task Checklist** | `C:\Users\Devteam\.gemini\antigravity\brain\...\task.md` | Progress tracking |

### Data & Seed Files

| File | Location | Purpose |
|------|----------|---------|
| **Employee Data** | `Data/Exsisting-employee-dataoseed.json` | 70+ real employee records for seeding |

### Agent-Specific Documents

| Agent Type | Document | Location |
|------------|----------|----------|
| **Documentation Manager** | `documentation-manager.md` | `.agent/agents/documentation-manager.md` |
| **Component Designer** | `component-design-template.md` | `.agent/templates/component-design-template.md` |

---

## 🎯 Quick Decision Matrix

### When to Use Context7 MCP

| Scenario | Action | Example |
|----------|--------|---------|
| **Installing new package** | Query Context7 for latest version | `@mcp:context7 resolve-library-id "prisma"` |
| **Learning new API** | Query Context7 for docs | `@mcp:context7 query-docs /vercel/next.js "Server Actions"` |
| **Best practices** | Query Context7 | `@mcp:context7 query-docs /prisma/docs "PostgreSQL setup"` |
| **Version conflicts** | Check LATEST-VERSIONS.md first, then Context7 | - |

### When to Update Documents

| Event | Update This Document | How |
|-------|---------------------|-----|
| New dependency added | `LATEST-VERSIONS.md` | Add to package list with version |
| New feature implemented | `skill-loop-mvp.md` | Mark task as complete `[x]` |
| Setup process changed | `PROJECT-SETUP.md` | Update step-by-step instructions |
| New component created | Component docs in `Docs/components/` | Use template |
| Database schema changed | `skill-loop-mvp.md` (Phase 1) | Update schema section |

---

## 🏗️ Architecture Quick Reference

### Tech Stack (Latest Versions)

```
Frontend:   Next.js 16.1.1 (App Router, Server Components, Server Actions)
UI:         shadcn/ui (Nova preset, emerald theme, Remix icons)
Styling:    Tailwind CSS v4
Backend:    Next.js Server Actions (NO API routes)
Database:   PostgreSQL 16 (Docker)
ORM:        Prisma 6.19.2
Auth:       Auth.js v5 (Email OTP)
Email:      whatever is is the best .i ill give sender mail and pasrword for that
Upload:     UploadThing (S3-backed)
Charts:     Recharts
```

### Database Schema (15 Tables)

1. User, 2. Skill, 3. Assessment, 4. Question, 5. AssessmentResult
6. SkillMatrix, 7. TrainingTopic, 8. TrainingAssignment, 9. TrainingProgress
10. CompletionProof, 11. Feedback, 12. Notification, 13. TrainingCalendar
14. Attendance, 15. TNA

**Full schema:** See `skill-loop-mvp.md` Phase 1, Task T1.3

### File Structure

```
skill-loop/
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed 70+ employees
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, OTP verification
│   │   ├── (dashboard)/     # All 4 persona dashboards
│   │   └── api/             # UploadThing route only
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── auth/            # Auth components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── assessments/     # Assessment components
│   │   └── skill-matrix/    # Skill visualization
│   ├── lib/
│   │   ├── auth.ts          # Auth.js config
│   │   ├── prisma.ts            # Prisma client
│   │   └── email.ts         #  email
│   └── actions/             # Server Actions (NO API routes)
└── docker-compose.yml       # PostgreSQL + pgAdmin
```

---

## 🎨 Design System Rules

### Colors (Emerald Theme)

```
Primary:    Emerald (green-500, green-600)
Secondary:  Gray (gray-100 to gray-900)
Accent:     Use from emerald palette
Success:    Green
Warning:    Yellow/Amber
Error:      Red
Info:       Blue

🚫 BANNED: Purple, Violet (any shade)
```

### Component Design Pattern

**Every component MUST follow this structure:**

```typescript
// 1. Imports (grouped)
import { type ComponentProps } from "react"
import { Card } from "@/components/ui/card"

// 2. Types
interface MyComponentProps {
  data: SomeType
  onAction?: () => void
}

// 3. Component (Server Component by default)
export default async function MyComponent({ data, onAction }: MyComponentProps) {
  // 4. Data fetching (if needed)
  const items = await prisma.item.findMany()
  
  // 5. Render
  return (
    <Card>
      {/* Component content */}
    </Card>
  )
}

// 6. Client Component (only if needed)
"use client"
export function MyClientComponent() {
  // Interactive logic
}
```

### Server Actions Pattern

```typescript
// actions/my-actions.ts
"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createItem(formData: FormData) {
  const name = formData.get("name") as string
  
  const item = await prisma.item.create({
    data: { name }
  })
  
  revalidatePath("/items")
  return { success: true, item }
}
```

---

## 📖 Context7 MCP Usage Rules

### Mandatory Context7 Queries

**BEFORE:**
1. Installing any new package → Query for latest version
2. Using new Next.js feature → Query for best practices
3. Implementing auth flow → Query Auth.js docs
4. Database operations → Query Prisma docs

**Query Pattern:**
```typescript
// Step 1: Resolve library ID
@mcp:context7 resolve-library-id "next.js" "Server Actions tutorial"

// Step 2: Query specific docs
@mcp:context7 query-docs /vercel/next.js/v16.1.1 "How to use Form component"

// Step 3: Apply knowledge
// ... implement based on official docs
```

### Context7 Best Practices

1. **Always use latest version** - Check `LATEST-VERSIONS.md` first
2. **Query before implementing** - Don't guess, get official docs
3. **Update docs after learning** - Add examples to `LATEST-VERSIONS.md`
4. **Cite sources** - Link to Context7 docs in comments

---

## ✅ Component Creation Checklist

When creating ANY new component:

- [ ] Read component design template (`.agent/templates/component-design-template.md`)
- [ ] Query Context7 for latest patterns
- [ ] Use Server Component by default
- [ ] Add "use client" only if interactive
- [ ] Follow emerald color scheme
- [ ] Use shadcn/ui components
- [ ] Add TypeScript types
- [ ] Document props with JSDoc
- [ ] Create component doc in `Docs/components/[name].md`
- [ ] Update `AGENT-BRAIN.md` with new component location

---

## 🔄 Document Update Protocol

### When You Complete a Task

1. **Mark in task.md:** Change `[ ]` to `[x]`
2. **Update implementation plan:** Mark phase task complete
3. **Create component doc:** If new component created
4. **Update AGENT-BRAIN.md:** Add to quick reference
5. **Commit message:** `feat: [component name] - [what it does]`

### When You Learn Something New

1. **Query Context7:** Get official docs
2. **Update LATEST-VERSIONS.md:** Add example
3. **Document in AGENT-BRAIN.md:** Add to quick reference
4. **Share pattern:** Add to templates if reusable

---

## 🚀 Phase Execution Guide

### Current Phase Status

**Check:** `C:\Users\Devteam\.gemini\antigravity\brain\...\task.md`

### Phase Flow

```
Phase 1: Foundation & Setup (4h)
  → Read: PROJECT-SETUP.md
  → Output: Database running, schema applied, seed data loaded

Phase 2: Authentication (3h)
  → Read: LATEST-VERSIONS.md (Auth.js section)
  → Query Context7: Auth.js email OTP
  → Output: Email OTP working

Phase 3: Assessment Engine (4h)
  → Read: PRD Section 6.3 (Assessment Module)
  → Output: Full assessment engine with auto-grading

Phase 4-9: See skill-loop-mvp.md
```

---

## 🎯 Success Metrics

**Feature Coverage:** 86% (11 full + 2 basic modules)

**Must-Have Features:**
- ✅ Email OTP auth
- ✅ All 4 persona dashboards
- ✅ Full assessment engine
- ✅ Training assignment + progress tracking
- ✅ Proof upload + approval workflow
- ✅ Skill matrix visualization
- ✅ Email notifications (2 types minimum)

---

## 🆘 Troubleshooting

### Common Issues

| Issue | Check | Solution |
|-------|-------|----------|
| Dependency version mismatch | `LATEST-VERSIONS.md` | Use exact versions listed |
| Component design unclear | `.agent/templates/component-design-template.md` | Follow template |
| Database connection failed | `PROJECT-SETUP.md` | Restart Docker |
| Context7 query fails | Internet connection | Check connection, retry |
| Document not found | This brain file | Use document organization table |

---

## 📌 Critical Reminders

1. **NO API Routes** - Use Server Actions only
2. **NO Purple Colors** - Emerald theme only
3. **Context7 First** - Query before implementing
4. **Update Docs** - Every new component/feature
5. **Server Components Default** - Client only when needed
6. **PRD is Source of Truth** - Feature requirements
7. **Latest Versions Only** - Check LATEST-VERSIONS.md
8. **Follow Templates** - Consistent design patterns

---

## 🔗 Quick Links

- **PRD:** `Docs/skillloop_prd.md`
- **Setup Guide:** `PROJECT-SETUP.md`
- **Versions:** `LATEST-VERSIONS.md`
- **Implementation Plan:** `skill-loop-mvp.md`
- **Task Tracking:** Brain artifact `task.md`
- **Employee Data:** `Data/Exsisting-employee-dataoseed.json`

---

## 📝 Agent Responsibilities

### Documentation Manager Agent
- **File:** `.agent/agents/documentation-manager.md`
- **Role:** Keep all docs updated, organized, and consistent
- **Triggers:** New feature, version update, component creation

### Component Designer Agent
- **Template:** `.agent/templates/component-design-template.md`
- **Role:** Ensure consistent component design patterns
- **Triggers:** New component creation

---

**Last Updated:** 2026-01-25  
**Maintained By:** Documentation Manager Agent  
**Version:** 1.0.0

---

**Remember: This brain document is your starting point. Read it before every session!** 🧠
