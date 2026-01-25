# Skill Loop - Training Management System

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Tech Stack

- **Framework**: Next.js 16.1.4 (App Router)
- **Database**: PostgreSQL with Prisma ORM 7.3.0
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Language**: TypeScript

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
