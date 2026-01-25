# Skill Loop - Agent Instructions

## Project Overview

**Skill Loop** is a comprehensive employee skill management and training system designed to track, assess, and develop workforce capabilities.

### Technology Stack

- **Framework**: Next.js 16.1.4 (App Router)
- **Language**: TypeScript 5
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (via Docker)
- **ORM**: Prisma 6.19.2
- **Authentication**: NextAuth.js v5 (beta.30)
- **Email**: 
- **File Upload**: UploadThing
- **Charts**: Recharts 3.7.0
- **PDF Generation**: jsPDF, @react-pdf/renderer
- **Icons**: Remix Icon

### Core Features

1. **Skill Matrix Management**
   - Track employee skills across Technical, Soft, and Domain categories
   - Multi-level proficiency tracking (Beginner → Expert)
   - Department-wise skill mapping

2. **Assessment System**
   - Multiple assessment types (Initial, Progress, Final, Certification)
   - MCQ, Descriptive, and Practical question types
   - Automated scoring and performance tracking

3. **Training Management**
   - Online, Classroom, and Self-paced training types
   - Training assignments and progress tracking
   - Resource library (videos, documents, articles)

4. **Analytics & Reporting**
   - Skill gap analysis
   - Training effectiveness metrics
   - Department and individual performance dashboards
   - PDF report generation

5. **Role-Based Access**
   - Admin: Full system access
   - Manager: Department-level management
   - Trainer: Training content and assessment creation
   - Employee: Self-assessment and training access

---

## Agent Development Rules

### 🔍 Documentation & Best Practices

#### Rule 1: Always Use Context7 MCP for Documentation

**MANDATORY**: Every time you need to reference documentation, implement a feature, or solve a problem, you **MUST** use `@mcp:context7` to query the latest official documentation.

**When to use Context7:**
- Implementing Next.js 16 features (App Router, Server Actions, caching,proxy etc.)
- Working with Prisma (schema, queries, relations, migrations)
- Configuring NextAuth.js authentication flows
- Any library or framework usage questions
- Best practices and patterns for the tech stack

**Example usage:**
```
Before adding authentication middleware, query Context7:
- Topic: "Next.js 16 middleware authentication patterns"
- Topic: "NextAuth.js v5 middleware configuration"

Before creating Prisma relations, query Context7:
- Topic: "Prisma latest version many-to-many relations"
- Topic: "Prisma schema best practices for user roles"
```

#### Rule 2: Always Use shadcn MCP for UI Components

**MANDATORY**: Every time you add, modify, or reference UI components, you **MUST** use `@mcp:shadcn` to ensure consistency with the shadcn/ui component library.

**When to use shadcn MCP:**
- Adding new UI components to the project
- Looking for component examples and usage patterns
- Understanding component APIs and props
- Finding pre-built patterns (forms, dialogs, modals, etc.)
- Checking for component updates or variants

**Workflow:**
1. **Search for components**: Use `@mcp:shadcn` search to find available components
2. **Get examples**: Use `@mcp:shadcn` to find usage examples and demos
3. **Add components**: Use the CLI command provided by shadcn MCP
4. **Follow patterns**: Implement components following shadcn conventions

**Example usage:**
```
Before adding a form:
1. Search shadcn MCP for "form" components
2. Get examples for form-demo from shadcn MCP
3. Add component: npx shadcn@latest add form
4. Follow the example pattern for implementation

Before creating a data table:
1. Search shadcn MCP for "table" components
2. Get examples for data-table from shadcn MCP
```

---

### 📋 Next.js 16 Best Practices

1. **Use Server Components by Default**
   - Only add `"use client"` when necessary (hooks, event handlers, browser APIs)
   - Fetch data directly in Server Components
   - Use Server Actions for mutations

2. **App Router Structure**
   - Follow the `/app` directory structure
   - Use route groups `(group)` for organization
   - Implement parallel routes for complex layouts
   - Use proper loading.tsx and error.tsx boundaries

3. **Data Fetching**
   - Prefer Server Components for data fetching
   - Use `fetch` with proper caching strategies
   - Implement Suspense boundaries with loading states
   - Use Server Actions for mutations instead of API routes

4. **Performance**
   - Use `next/image` for all images
   - Implement dynamic imports for heavy components
   - Utilize Next.js caching (cacheLife, cacheTag APIs)
   - Enable PPR (Partial Prerendering) where beneficial

5. **Metadata & SEO**
   - Define metadata in layout.tsx and page.tsx
   - Use generateMetadata for dynamic metadata
   - Implement proper Open Graph tags

---

### 🗄️ Prisma Best Practices

1. **Schema Design**
   - Use descriptive model and field names
   - Add `@db` attributes for specific database types
   - Include proper indexes for frequently queried fields
   - Use `@@index` and `@@unique` constraints
   - Add validation in the schema where possible

2. **Relations**
   - Always define bidirectional relations
   - Use appropriate relation modes (`onDelete`, `onUpdate`)
   - Consider CASCADE vs RESTRICT carefully
   - Use explicit relation names for multiple relations between models

3. **Queries**
   - Use `select` to fetch only needed fields
   - Implement `include` for related data strategically
   - Leverage Prisma's type safety - avoid raw queries unless necessary
   - Use transactions for multi-step operations
   - Implement proper pagination with `skip` and `take`

4. **Migrations**
   - Never edit migration files manually
   - Use descriptive migration names
   - Test migrations in development before production
   - Keep migrations incremental and focused

5. **Performance**
   - Use connection pooling (already configured)
   - Implement query batching with `findMany`
   - Use Prisma's query optimization features
   - Monitor queries with Prisma Studio during development

---

### 🎨 UI & Component Guidelines

1. **shadcn/ui Components**
   - Always use shadcn components before creating custom ones
   - Follow shadcn naming conventions
   - Keep component variants in line with the design system
   - Use CVA (Class Variance Authority) for component variants

2. **Styling**
   - Use Tailwind utility classes (v4 syntax)
   - Follow the theme colors defined in `components.json`
   - Maintain consistent spacing scale
   - Use CSS variables for theme-aware colors
   - Implement dark mode support

3. **Accessibility**
   - Use semantic HTML elements
   - Include proper ARIA labels
   - Ensure keyboard navigation works
   - Test with screen readers
   - Follow WCAG 2.1 guidelines

4. **Forms**
   - Use React Hook Form with Zod validation
   - Follow shadcn form patterns
   - Provide clear error messages
   - Implement proper loading states
   - Show success feedback

---

### 🔐 Authentication & Authorization

1. **NextAuth.js v5 Patterns**
   - Use the beta version (5.0.0-beta.30)
   - Configure Prisma adapter correctly
   - Implement proper session strategies
   - Use middleware for route protection
   - Handle callbacks appropriately

2. **Role-Based Access Control**
   - Check user roles in Server Components
   - Implement middleware-level checks
   - Use proper TypeScript types for roles
   - Provide appropriate error messages for unauthorized access

---

### 📁 File Organization

```
skillloop/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes group
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes (minimal, prefer Server Actions)
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── ...               # Feature components
├── lib/                   # Utility functions
│   ├── prisma.ts         # Prisma client singleton
│   ├── auth.ts           # Auth configuration
│   └── utils.ts          # Helper functions
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Seed script
│   └── migrations/       # Migration history
├── public/               # Static assets
└── types/                # TypeScript types
```

---

### ✅ Code Quality Standards

1. **TypeScript**
   - Enable strict mode
   - Define proper types, avoid `any`
   - Use Zod for runtime validation
   - Leverage Prisma's generated types

2. **Error Handling**
   - Use try-catch in Server Actions
   - Provide user-friendly error messages
   - Log errors appropriately
   - Implement error boundaries

3. **Code Style**
   - Follow ESLint rules
   - Use consistent naming conventions
   - Write descriptive comments for complex logic
   - Keep functions focused and small

4. **Testing Mindset**
   - Write code that's easy to test
   - Consider edge cases
   - Validate user inputs
   - Handle loading and error states

---

### 🚀 Deployment Considerations

1. **Environment Variables**
   - Never commit `.env.local`
   - Validate required env vars on startup
   - Use type-safe env var access

2. **Database**
   - Always use migrations for schema changes
   - Test seeds work on fresh databases
   - Plan for data migration strategies

3. **Performance**
   - Optimize images and assets
   - Implement proper caching strategies
   - Monitor bundle size
   - Use lazy loading where appropriate

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npx prisma studio             # Open Prisma Studio UI

# Database
npx prisma migrate dev        # Create and apply migration
npx prisma migrate reset      # Reset database (CAUTION)
npx prisma db seed           # Seed database
npx prisma generate          # Generate Prisma Client

# UI Components (via shadcn MCP)
npx shadcn@latest add [component]  # Add shadcn component
npx shadcn@latest add form         # Example: Add form component

# Build
npm run build                # Production build
npm run start               # Production server
```

---

## Important Notes for AI Agents

### Before Making Changes:
1. ✅ Check Context7 for latest documentation and best practices
2. ✅ Search shadcn MCP for existing UI components
3. ✅ Review the Prisma schema to understand data structure
4. ✅ Consider implications on authentication and authorization
5. ✅ Ensure changes follow TypeScript strict mode

### When Adding Features:
1. ✅ Start with Server Components
2. ✅ Use shadcn components for UI
3. ✅ Implement proper error handling
4. ✅ Add loading states
5. ✅ Consider mobile responsiveness
6. ✅ Test with different user roles
7. ✅ Update relevant documentation

### When Debugging:
1. ✅ Check browser console for client errors
2. ✅ Check terminal for server errors
3. ✅ Use Prisma Studio to inspect database
4. ✅ Verify environment variables are set
5. ✅ Check Context7 for known issues and solutions

---

**Remember**: The combination of Context7 for documentation and shadcn MCP for UI components ensures that every implementation follows the latest best practices and maintains consistency across the codebase. Always consult these resources before implementing features.
