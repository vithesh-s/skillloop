# Phase Breakdown

## Task 1: Foundation & Database Setup

Set up the core infrastructure for Skill Loop:

- Create Prisma schema in `prisma/schema.prisma` with all 15 models (User, Skill, Assessment, Question, AssessmentAttempt, Answer, SkillMatrix, Training, OnlineTraining, OfflineTraining, TrainingAssignment, ProgressUpdate, ProofOfCompletion, Attendance, Feedback, Notification, SystemConfig)
- Configure PostgreSQL connection and run migrations
- Create seed script in `prisma/seed.ts` to import 70+ employees and roles abd localtions from app/Data/Exsisting-employee-dataoseed.json 
- Set up Prisma client in lib/db.ts
- Add demo data for skills(C# .Net Blazor), and assessments


## Task 2: Authentication & Authorization System

Implement passwordless authentication using NextAuth v5:

- Configure NextAuth in lib/auth.ts with magic link email provider
- Set up Office 365 email service in lib/email.ts for OTP delivery
- Create login page at app/(auth)/login/page.tsx
- Implement RBAC middleware in middleware.ts for role-based route protection (ADMIN, TRAINER, EMPLOYEE, MANAGER)
- Create server actions in actions/auth.ts for login/logout
- Add session management with Prisma adapter


## Task 3: Admin Configuration Module

Build admin tools for system configuration:

- Create admin dashboard at app/(dashboard)/admin/page.tsx
- Implement skill catalog management (CRUD) in app/(dashboard)/admin/skills/page.tsx
- Build job role and competency framework editor in app/(dashboard)/admin/roles/page.tsx
- Create user management interface in app/(dashboard)/admin/users/page.tsx
- Add server actions in actions/users.ts and actions/skills.ts
- Implement system configuration settings (induction duration, passing scores, etc.)


## Task 4: Assessment Engine - Creation & Execution

Build the complete assessment system:

- Create assessment builder UI in app/(dashboard)/admin/assessments/create/page.tsx with question bank support (MCQ, Descriptive, True/False, Fill-in-blank)
- Implement bulk question upload via CSV in actions/assessments.ts
- Build assessment taking interface in app/(dashboard)/employee/assessments/[id]/page.tsx with timer and progress saving
- Add auto-grading for objective questions
- Create manual grading interface for descriptive answers in app/(dashboard)/trainer/grading/page.tsx
- Display results with skill-wise breakdown


## Task 5: Skill Gap Analysis & TNA Generation

Implement automated skill gap identification:

- Create gap analysis engine in actions/skill-matrix.ts that compares actual vs desired competency levels
- Build TNA (Training Need Analysis) report generator
- Create skill gap dashboard at app/(dashboard)/employee/skill-gaps/page.tsx
- Implement gap categorization (Critical >50%, High 30-50%, Medium 15-30%, Low <15%)
- Add admin TNA review interface in app/(dashboard)/admin/tna/page.tsx
- Generate training recommendations based on identified gaps


## Task 6: Training Management - Creation & Assignment

Build training topic creation and assignment system:

- Create training topic builder in app/(dashboard)/admin/training/create/page.tsx supporting both online and offline modes
- Implement online training configuration (resources, duration, mentor assignment) in components/training/OnlineTrainingForm.tsx
- Build offline training setup (schedule, venue, materials upload) in components/training/OfflineTrainingForm.tsx
- Add training assignment interface in app/(dashboard)/manager/assign-training/page.tsx
- Create server actions in actions/trainings.ts for CRUD operations
- Implement UploadThing integration in lib/uploadthing.ts for training materials


## Task 7: Training Calendar & Scheduling

Implement training calendar and scheduling system:

- Build calendar view component in components/training/TrainingCalendar.tsx using Recharts for visualization
- Create monthly, weekly, and list views with filtering (mode, department, trainer, date range)
- Implement calendar publishing workflow in app/(dashboard)/admin/calendar/page.tsx
- Add individual training record view in app/(dashboard)/employee/my-trainings/page.tsx
- Create email notifications for calendar updates using email
- Display upcoming trainings in employee dashboard


## Task 8: Progress Tracking - Online Training

Build online training progress tracking system:

- Create weekly progress update form in app/(dashboard)/employee/training/[id]/progress/page.tsx
- Implement progress dashboard with timeline visualization in components/training/ProgressTimeline.tsx
- Build mentor review interface in app/(dashboard)/trainer/review-progress/page.tsx
- Add proof of completion upload using UploadThing in components/training/ProofUpload.tsx
- Create approval workflow for proof documents in actions/proofs.ts
- Implement automated reminder emails for overdue progress updates


## Task 9: Attendance Management - Offline Training

Implement offline training attendance system:

- Create attendance recording interface in app/(dashboard)/trainer/attendance/[sessionId]/page.tsx
- Build bulk attendance upload via CSV
- Implement attendance history view in components/training/AttendanceHistory.tsx
- Add attendance percentage calculation and low attendance alerts
- Create attendance correction workflow with audit trail
- Display attendance status in employee training records


## Task 10: Post-Training Assessment & Feedback

Implement post-training evaluation system:

- Create automated post-training assessment scheduling (30 days after completion) in actions/assessments.ts
- Build feedback collection forms in app/(dashboard)/employee/training/[id]/feedback/page.tsx for both online and offline training
- Implement training effectiveness calculation comparing pre/post scores
- Create feedback summary reports in app/(dashboard)/admin/reports/feedback/page.tsx
- Add automated email reminders for pending assessments and feedback
- Update skill matrix based on post-training assessment results


## Task 11: Skill Matrix Visualization

Build comprehensive skill matrix visualization:

- Create skill matrix heat map using Recharts in components/skill-matrix/SkillMatrixHeatMap.tsx
- Implement spider/radar charts for competency visualization
- Build individual skill matrix view in app/(dashboard)/employee/skill-matrix/page.tsx
- Create team skill matrix for managers in app/(dashboard)/manager/team-skills/page.tsx
- Add role-based competency framework comparison
- Implement skill gap highlighting with color coding (red for critical, yellow for medium, green for competent)


## Task 12: Notification System

Implement comprehensive notification system:

- Create notification model and database queries in actions/notifications.ts
- Build notification bell component with polling in components/notifications/NotificationBell.tsx
- Implement email notifications using email for key events (training assigned, assessment due, progress overdue, feedback pending)
- Create notification preferences in user settings
- Add notification history view in app/(dashboard)/notifications/page.tsx
- Implement notification triggers for all major workflows (assessment, training, progress, feedback)


## Task 13: Reporting & Analytics Dashboard

Build comprehensive reporting and analytics:

- Create admin analytics dashboard in app/(dashboard)/admin/analytics/page.tsx with key metrics (training completion rates, assessment scores, skill gap trends)
- Implement training effectiveness reports using Recharts
- Build organization-wide skill gap analysis in app/(dashboard)/admin/reports/skill-gaps/page.tsx
- Create individual employee reports with PDF export using jsPDF
- Add trainer effectiveness reports based on feedback data
- Implement role-wise competency reports for managers
- Create API routes in app/api/reports/ for complex report generation


## Task 14: Bulk Operations & Data Management

Implement bulk operations for efficient data management:

- Create bulk user import via CSV in app/api/bulk/import-users/route.ts
- Implement bulk question import for assessments
- Build bulk training assignment interface in app/(dashboard)/admin/bulk-assign/page.tsx
- Add data export functionality (users, assessments, training records) to CSV/Excel
- Create data validation and error reporting for bulk operations
- Implement progress indicators for long-running bulk operations


## Task 15: AI Integration Preparation & System Optimization

Prepare system for AI features and optimize performance:

- Implement database indexes for common queries (notification queries, skill matrix lookups, training assignments)
- Add caching strategy using Next.js `unstable_cache` for frequently accessed data (role requirements, system config)
- Create AI integration stubs in actions/ai.ts for future question generation and grading assistance
- Implement pagination for large lists (assessments, trainings, users)
- Add performance monitoring and logging
- Optimize Prisma queries with proper includes and selects
- Create API routes for future AI integration in app/api/ai/