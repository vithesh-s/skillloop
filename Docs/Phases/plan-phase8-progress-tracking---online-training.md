# Phase 8: Progress Tracking for Online Training

## Overview
Build a modern progress tracking system for online training with weekly updates, proof submissions, mentor reviews, and automated reminders. Focus on clean UX with modern shadcn components and smooth interactions.

---

## 1. UploadThing Setup

### Files to Create:
- `app/api/uploadthing/core.ts` - FileRouter with `proofUploader` endpoint (PDF, images, docs, 10MB max)
- `app/api/uploadthing/route.ts` - API route handler
- `lib/uploadthing.ts` - Client utilities (generateUploadButton, generateUploadDropzone)

### Key Points:
- Use `auth()` for authentication
- Store `assignmentId` + `userId` in metadata
- Create `ProofOfCompletion` record in `onUploadComplete`

---

## 2. Validation Schemas

### Add to `lib/validation.ts`:

**`progressUpdateSchema`**
- assignmentId, weekNumber (1-52), completionPercentage (0-100)
- topicsCovered, timeSpent, challenges, nextPlan (all optional)
- updateDate (validate not future)

**`proofSubmissionSchema`**
- assignmentId, fileName, filePath (URL), description (optional)

**`proofReviewSchema`**
- proofId, status (APPROVED/REJECTED), reviewerComments (optional)

Export types: `ProgressUpdateInput`, `ProofSubmissionInput`, `ProofReviewInput`

---

## 3. Server Actions

### `actions/progress.ts`
- `createProgressUpdate` - Upsert weekly progress, notify mentor
- `getProgressUpdates` - Fetch all with stats
- `getAssignmentProgress` - Full progress data + statistics
- `addMentorComment` - Add mentor feedback, notify trainee

### `actions/proofs.ts`
- `submitProof` - Create PENDING proof, notify mentor
- `getProofsForAssignment` - Fetch all proofs with reviewer data
- `getPendingProofsForReview` - Mentor's pending reviews
- `reviewProof` - Approve/reject, update SkillMatrix if approved
- `deleteProof` - Delete if PENDING only

---

## 4. Employee Progress Page

### `app/(dashboard)/employee/training/[id]/progress/page.tsx`
Server component showing:
- Training header (topic, skill, dates)
- Progress stats card
- Weekly update form
- Progress timeline with charts
- Proof upload (if >80% complete)

### `components/training/ProgressUpdateForm.tsx`
Modern form with:
- **Slider** for completion % (visual indicator with gradient)
- **Textarea** for topics/challenges/plans
- **Input** for time spent
- **Date picker** for update date
- Collapsible section showing previous week's data
- Modern submit button with loading state

**shadcn components:** `slider`, `textarea`, `input`, `calendar`, `button`, `card`, `label`, `form`

---

## 5. Progress Visualization

### `components/training/ProgressTimeline.tsx`
Dual view component:

**Chart View (Recharts):**
- **ComposedChart** with Line (completion %) + Bar (time spent)
- Gradient fills, smooth animations
- Interactive tooltips with rich data
- Reference lines for targets/averages

**List View:**
- Timeline cards with:
  - Week badge + completion progress bar
  - Expandable topics section
  - Highlighted mentor comments (if present)
  - Time indicator + date
  - Status icons (overdue in red)

**shadcn components:** `card`, `badge`, `progress`, `separator`, `collapsible`, `tabs`

---

## 6. Mentor Review Dashboard

### `app/(dashboard)/trainer/review-progress/page.tsx`
Overview with tabs:
- "Active Trainings" 
- "Pending Reviews"

### `components/training/MentorReviewDashboard.tsx`
Modern card grid with:
- Trainee avatar + name
- Training info + skill badge
- Progress ring chart (mini)
- Last update badge
- Quick action buttons
- Overdue alerts (red indicator)

Filters: trainee, skill, status
Sort: date, completion %

**shadcn components:** `tabs`, `card`, `avatar`, `badge`, `button`, `input`, `select`, `command`

### `app/(dashboard)/trainer/review-progress/[assignmentId]/page.tsx`
Detailed review page with:
- Trainee profile card
- Progress timeline (shared component)
- Mentor comment forms (inline)
- Proof review section
- "Mark Complete" action

### `components/training/MentorCommentForm.tsx`
Inline comment editor:
- Textarea with character count
- Save button with optimistic UI
- Edit mode for existing comments

**shadcn components:** `textarea`, `button`, `label`, `card`

---

## 7. Proof Upload & Review

### `components/training/ProofUpload.tsx`
Modern upload interface:
- UploadThing dropzone with drag & drop
- File type icons + size limits
- Progress bar during upload
- Uploaded files list with:
  - File preview (images/PDFs)
  - Status badges (colored)
  - Download buttons
  - Delete option (PENDING only)
- Description field per file

**shadcn components:** `card`, `badge`, `button`, `dialog`, `textarea`, `alert`

### `components/training/ProofReviewCard.tsx`
Review interface for trainers:
- File preview/download
- Approve/Reject buttons (color-coded)
- Comment textarea
- Confirmation dialog before approval

**shadcn components:** `card`, `button`, `dialog`, `textarea`, `alert-dialog`, `badge`

---

## 8. Email Reminders

### `lib/email.ts`
Add templates:
- `progress-overdue` - Friendly reminder for overdue updates
- `proof-pending-review` - Mentor reminder for pending reviews

### `lib/cron-jobs.ts`
- `checkOverdueProgressUpdates()` - Email if no update in 7 days
- `checkPendingProofReviews()` - Remind mentors after 3 days, escalate after 7

### `app/api/cron/reminders/route.ts`
Protected cron endpoint (auth with secret)

---

## 9. Integration Updates

### `components/dashboard/training/MyTrainingsList.tsx`
- Link "View Progress" to `/employee/training/[id]/progress`
- Show progress indicator (e.g., "3/8 weeks")
- Add "Submit Proof" button for >80% complete
- Preview latest mentor comment

### `actions/trainings.ts`
- Auto-update status to IN_PROGRESS on first progress update
- Check for approved proof before marking COMPLETED

### `app/(dashboard)/trainer/page.tsx`
Add count cards:
- "Pending Progress Reviews"
- "Pending Proof Reviews"

---

## 10. UI Polish

### `components/training/ProgressStats.tsx`
Stats dashboard card:
- Total/completed weeks
- Average completion %
- Total time spent
- Projected completion date
- Mini sparkline charts (Recharts)
- Color-coded indicators

**shadcn components:** `card`, `badge`, `progress`, `separator`

### Loading & Error States
- `app/(dashboard)/employee/training/[id]/progress/loading.tsx` - Skeleton UI
- `app/(dashboard)/employee/training/[id]/progress/error.tsx` - Error boundary
- Same for trainer review pages

**shadcn components:** `skeleton`, `alert`

---

## Modern UI Enhancements

Use modern patterns:
- **Glassmorphism** for cards (backdrop-blur, subtle borders)
- **Gradient accents** for progress indicators
- **Animated charts** with smooth transitions (Recharts animations)
- **Micro-interactions** (hover states, loading spinners)
- **Status badges** with icons and colors
- **Empty states** with illustrations/icons
- **Responsive grids** (mobile-first)
- **Collapsible sections** to reduce clutter

---

## shadcn Components to Use

Core: `button`, `card`, `badge`, `input`, `textarea`, `label`, `form`, `slider`, `progress`, `tabs`, `avatar`, `dialog`, `alert-dialog`, `calendar`, `separator`, `collapsible`, `skeleton`, `alert`, `command`, `select`

Charts: Use `chart` component wrapper with Recharts

---

## Testing Checklist

- [ ] Employee submits weekly progress
- [ ] Charts render with animations
- [ ] Mentor adds comments
- [ ] File upload works (drag & drop)
- [ ] Proof approval updates status
- [ ] Email reminders send
- [ ] Notifications trigger
- [ ] Mobile responsive
- [ ] Permission checks enforce
- [ ] Edge cases handled (upsert, failures, concurrent reviews)