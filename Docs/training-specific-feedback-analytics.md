# Training-Specific Feedback Analytics

## Overview

This feature provides detailed feedback analysis at the individual training level, allowing administrators and managers to:

1. Select a specific training from a list
2. View completion and feedback submission statistics
3. See who has completed the training but not submitted feedback
4. Send reminders to users who haven't submitted feedback
5. Drill down to view each individual's detailed feedback responses

## Access Points

### For Admins
- Navigate to: **Admin** → **Training Feedback** (sidebar)
- URL: `/admin/reports/feedback/training`

### For Managers
- Navigate to: **Manager** → **Training Feedback** (sidebar)
- URL: `/admin/reports/feedback/training`

## Features

### 1. Training Selector

The page starts with a training selector dropdown that shows:
- Training name
- Mode (ONLINE/OFFLINE)
- Response rate (e.g., "15/20 responses")
- Feedback percentage badge (color-coded by rate)

### 2. Statistics Dashboard

Once a training is selected, you'll see four key metrics:

#### Total Completed
- Number of learners who have completed the training
- Includes all users with status = COMPLETED

#### Feedback Received
- Number of completed users who submitted feedback
- Shows response rate as a progress bar
- Percentage displayed below the bar

#### Pending Feedback
- Number of completed users who haven't submitted feedback
- These users can receive reminders

#### Average Rating
- Overall satisfaction score (1-5 scale)
- Color-coded: Green (4-5), Yellow (3-4), Red (<3)

### 3. Rating Breakdown

Displays average ratings across four dimensions:
- **Trainer Rating**: Quality of instruction
- **Content Rating**: Relevance and quality of material
- **Materials Rating**: Helpfulness of resources
- **Overall Rating**: General satisfaction

Each is color-coded based on the score.

### 4. Pending Feedback Table

Lists all learners who completed the training but haven't submitted feedback:

**Columns:**
- Checkbox for bulk selection
- Learner name and email
- Department
- Completion date
- Days since completion (color-coded: blue <7 days, amber 7-14 days, red >14 days)

**Actions:**
- Select individual users or use "Select All" checkbox
- Click "Send Reminders" button to send email reminders to selected users
- Reminder count updates in real-time

### 5. Submitted Feedback Table

Shows all learners who have submitted feedback:

**Columns:**
- Learner name and email
- Submission date
- Overall rating (with star icon, color-coded)
- Trainer rating
- Content rating
- Materials rating
- "View Details" button

**View Details Dialog:**
Opens a comprehensive modal showing:

**Rating Summary Cards:**
- Overall, Trainer, Content, Materials ratings (large, color-coded)

**Detailed Responses:**
1. What did you like most about this training?
2. What were your key learnings?
3. Topics that were confusing or unclear
4. Materials Helpful (star rating)
5. Interactive & Engaging (star rating)
6. Trainer Answered Questions (star rating)
7. Content Satisfaction (star rating)
8. Quality Rating (badge)
9. Do you feel more competent and confident in this skill?
10. Suggestions for Improvement

## Technical Implementation

### Server Actions

#### `getTrainingsWithFeedbackStats()`
- Fetches all trainings with completion/feedback counts
- Returns: Training list with statistics for dropdown

#### `getTrainingFeedbackDetails(trainingId)`
- Fetches detailed feedback analysis for a specific training
- Returns:
  - Training information
  - Statistics object (totalCompleted, feedbackCount, pendingCount, feedbackRate, avgRatings)
  - Array of detailed feedbacks with parsed JSON data
  - Array of pending users with days since completion

#### `sendFeedbackReminders(assignmentIds[])`
- Sends reminder emails to selected users
- Creates FEEDBACK_PENDING notifications
- Uses 'feedback-reminder' email template
- Returns success count

### Data Flow

1. **Page Load**: Calls `getTrainingsWithFeedbackStats()` to populate dropdown
2. **Training Selection**: Calls `getTrainingFeedbackDetails(trainingId)` to load details
3. **Send Reminders**: Calls `sendFeedbackReminders(selectedIds)` and refreshes data
4. **View Details**: Opens dialog with individual feedback data

### Database Queries

- Uses Prisma with proper includes for related data (user, feedback, training, skill)
- Filters by status = 'COMPLETED'
- Separates assignments into withFeedback/withoutFeedback arrays
- Parses JSON from feedback.comments field for detailed responses

### Email Integration

When "Send Reminders" is clicked:
1. Creates notification record (type: FEEDBACK_PENDING)
2. Sends email using 'feedback-reminder' template
3. Email includes:
   - User name
   - Training name
   - Skill name
   - Direct link to feedback form

### Real-time Updates

- After sending reminders, page refreshes training details
- Selected checkboxes are cleared
- Toast notification confirms success
- Pending users table updates to reflect new state

## User Workflow

### Admin/Manager wants to boost feedback rates:

1. Navigate to **Training Feedback** page
2. Select a training from the dropdown
3. Review the feedback rate percentage
4. Check the "Pending Feedback" table
5. Identify users with high "days since completion"
6. Select all or specific users
7. Click "Send Reminders" button
8. Receive confirmation toast
9. Monitor feedback rate improvement

### Admin/Manager wants to review individual feedback:

1. Navigate to **Training Feedback** page
2. Select a training from the dropdown
3. Scroll to "Feedback Responses" table
4. Click "View Details" on any learner
5. Review all 10 feedback questions and ratings
6. Close dialog and repeat for other learners
7. Identify patterns in responses (e.g., common suggestions)

## Color Coding

### Feedback Rate Badges:
- 🟢 Green (80%+): Excellent response rate
- 🟡 Yellow (50-79%): Moderate response rate
- 🔴 Red (<50%): Low response rate

### Rating Colors:
- 🟢 Green (4-5): Very satisfied
- 🟡 Yellow (3-4): Satisfied
- 🔴 Red (<3): Needs improvement

### Days Since Completion:
- 🔵 Blue (<7 days): Recent completion
- 🟠 Amber (7-14 days): Reminder due soon
- 🔴 Red (>14 days): Overdue for feedback

## Navigation

**From Overall Feedback Analytics:**
- Click "View Overall Analytics" button (top right) to go to aggregate feedback page at `/admin/reports/feedback`

**To Training-Specific Analytics:**
- Click "Training Feedback" in the sidebar to return to training-specific view

## Permissions

**Required Roles:**
- ADMIN (full access)
- MANAGER (full access)
- TRAINER (read-only access)

**Restricted Features:**
- Send Reminders: ADMIN, MANAGER only
- Trainers can view but cannot send reminders

## Integration with Other Features

### Complements:
- Overall Feedback Analytics (`/admin/reports/feedback`)
- Training Management
- User Management
- Notification System
- Email Service

### Data Sources:
- TrainingAssignment table (for completions)
- Feedback table (for responses)
- Training table (for training details)
- User table (for learner information)

## Future Enhancements

Potential improvements:
1. Export training-specific feedback to CSV
2. Automated reminders (not just manual)
3. Custom reminder message templates
4. Feedback comparison across multiple trainings
5. Trend analysis over time
6. Filter by department or role
7. Schedule periodic reminder campaigns

## Troubleshooting

**Issue: No trainings appear in dropdown**
- Ensure trainings have at least one completed assignment
- Check database for TrainingAssignment with status = 'COMPLETED'

**Issue: Reminder button disabled**
- Select at least one user from the pending list
- Verify you have ADMIN or MANAGER role

**Issue: Feedback details not showing**
- Verify feedback form submissions have comments field with JSON data
- Check browser console for JSON parsing errors

**Issue: Statistics not updating after reminder sent**
- Wait a few seconds for data refresh
- Manually refresh the page if needed
- Check that revalidatePath is working properly

## Related Documentation

- [Phase 9 Implementation Plan](../plan-phase9-post-training-assessment-&-feedback.md)
- [Feedback Schema Documentation](../lib/validation.ts)
- [Email Templates](../lib/email.ts)
- [Server Actions](../actions/feedback.ts)
