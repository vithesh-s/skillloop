# Product Requirements Document (PRD)
## SKILL LOOP - Learn, Apply & Improve

### Document Information
- **Product Name:** SKILL LOOP
- **Version:** 1.0
- **Date:** January 2026
- **Document Owner:** L&D Team

---

## 1. Executive Summary

SKILL LOOP is a comprehensive Learning & Management System designed to automate and manage the complete employee training lifecycle. The system creates a continuous improvement loop from initial skill assessment through training execution, feedback collection, and re-assessment, ensuring employees continuously develop competencies aligned with their roles.

---

## 2. Product Vision & Purpose

### 2.1 Vision
To create a self-sustaining learning ecosystem where employees continuously improve their skills through systematic assessment, targeted training, and regular feedback loops.

### 2.2 Purpose
The application manages and automates the complete employee training lifecycle including:
- Initial skill assessment and gap identification
- Training need analysis and planning
- Training calendar management and execution
- Progress tracking and attendance management
- Post-training assessment and feedback
- Continuous skill matrix updates

---

## 3. Scope

### 3.1 In Scope
- New hire onboarding and skill assessment
- Existing employee competency-based training
- Skill assessment and gap identification
- Training planning, assignment, and execution
- Progress tracking and evaluation
- Skill matrix management
- Mentor/Trainer assignment and management
- Weekly progress updates for online learning
- Automated notification system via email
- Training effectiveness measurement

### 3.2 Out of Scope
- Detailed HR administrative processes (payroll, leave management, etc.)
- Content creation tools (relies on external platforms like YouTube, Udemy, Coursera)
- Video conferencing integration
- Performance appraisal system

---

## 4. User Personas

### 4.1 Admin (HR/L&D Team)
**Role:** System administrator and training program manager

**Responsibilities:**
- Configure system settings (training cycles, competency levels)
- Create and manage user accounts
- Conduct skill assessments
- Approve training needs
- Create training topics and assign trainers/mentors
- Generate reports and analytics
- Monitor organization-wide training progress

**Goals:**
- Ensure all employees meet role-based competency requirements
- Track training ROI and effectiveness
- Identify skill gaps across the organization

### 4.2 Trainer/Mentor
**Role:** Subject matter expert facilitating learning

**Responsibilities:**
- Deliver assigned training sessions
- Upload training materials and resources
- Review learner progress for online training
- Provide feedback on learner performance
- Record attendance for offline training
- Create assessments for specific skills

**Goals:**
- Effectively transfer knowledge to learners
- Monitor learner engagement and progress
- Ensure training objectives are met

### 4.3 Employee (Learner)
**Role:** Training recipient working to improve skills

**Responsibilities:**
- Complete assigned skill assessments
- Attend scheduled training sessions
- Update weekly progress for online training
- Complete training within target timelines
- Provide feedback on training effectiveness
- Participate in re-assessments

**Goals:**
- Develop skills required for current and future roles
- Complete training efficiently
- Demonstrate competency improvement

### 4.4 Manager (Optional)
**Role:** Team leader overseeing employee development

**Responsibilities:**
- Assign mentors for team members
- Assign additional training topics
- Review team member progress
- Trigger reminder notifications for non-progressing employees
- Approve training requests

**Goals:**
- Ensure team maintains required competency levels
- Support career development of team members
- Align team skills with business objectives

---

## 5. Business Process Flows

### 5.1 New Employee Onboarding Flow

```
Employee Joins
    ↓
Initial Skill Assessment (Day 1-3)
    ↓
Skill Matrix Created & Gaps Identified
    ↓
Customized Induction Training Plan Created (Based on Assessment)
    ↓
Phase 1 Training (Configurable: Default 30 days)
    - Basic/Foundational Skills
    - Mentor/Trainer Assigned
    - Weekly Progress Updates (for online training)
    ↓
Phase 1 Assessment & Evaluation
    ↓
Phase 2 Training (Configurable: Additional 15-30 days)
    - Advanced/Role-Specific Skills
    - Topics assigned by Manager/Admin
    - Weekly Progress Updates
    ↓
Final Assessment
    ↓
Skill Matrix Updated
    ↓
New Gaps Identified
    ↓
Enter Continuous Learning Cycle (same as existing employees)
```

**Key Points:**
- Induction duration is configurable (default: 45 days total)
- Multiple training phases can be configured
- Each phase can have different skill focuses
- Initial assessment drives personalized induction plan
- Minimal HR administrative focus; emphasis on skill development

### 5.2 Existing Employee Continuous Learning Flow

```
Role-Based Skill Assessment
    ↓
Compare with Competency Matrix
    ↓
Skill Gaps Identified
    ↓
Training Need Analysis (TNA) Performed
    ↓
Training Topics Finalized
    ↓
Trainer/Mentor Assigned
    ↓
Training Calendar Published
    ↓
Employee Notified (Email)
    ↓
Training Execution
    ├─ Online Training
    │   ├─ Resources/Links Provided
    │   ├─ Weekly Progress Updates by Learner
    │   ├─ Progress Monitoring by Mentor
    │   └─ Mentor/Manager Review & Feedback
    │
    └─ Offline Training
        ├─ Venue & Schedule Details
        ├─ Attendance Recording
        └─ Immediate Feedback Collection
    ↓
Training Completion
    ↓
Feedback Collection
    ↓
30-Day Post-Training Assessment
    ↓
Skill Matrix Updated
    ↓
New Gaps Identified (if any)
    ↓
Cycle Repeats
```

---

## 6. Detailed Functional Requirements

### 6.1 User Management Module

#### 6.1.1 User Account Management
**FR-UM-001:** System shall allow Admin to create user accounts with the following information:
- Full Name
- Employee ID
- Email Address
- Department
- Job Role
- User Type (Admin/Trainer/Employee/Manager)
- Date of Joining

**FR-UM-002:** System shall support role-based access control:
- Admin: Full system access
- Trainer/Mentor: Access to assigned training and learners
- Employee: Access to own training and assessments
- Manager: Access to team members' progress and training assignment

**FR-UM-003:** System shall allow users to update their profile information:
- Contact details
- Profile picture
- Emergency contact
- Educational qualifications

**FR-UM-004:** System shall maintain user activity logs for audit purposes.

---

### 6.2 System Configuration Module

#### 6.2.1 Induction Training Configuration
**FR-SC-001:** System shall allow Admin to configure induction training parameters:
- Total induction duration (default: 45 days)
- Number of training phases (e.g., Phase 1: 30 days, Phase 2: 15 days)
- Phase-wise focus areas (Basic/Advanced/Role-Specific)
- Assessment frequency

**FR-SC-002:** System shall allow creation of multiple induction templates based on:
- Job roles
- Department
- Experience level (Fresher/Experienced)

**FR-SC-003:** System shall allow Admin to define:
- Default competency levels per role
- Minimum passing scores for assessments
- Re-assessment triggers
- Progress update frequency (default: weekly for online training)

---

### 6.3 Skill Assessment Module

#### 6.3.1 Assessment Creation
**FR-SA-001:** System shall allow Admin/Trainer to create assessments with:
- Assessment title
- Description and objectives
- Question bank (MCQ and Descriptive)
- Total marks
- Passing score
- Time limit
- Assessment type (Initial/Progress/Post-Training)

**FR-SA-002:** System shall support multiple methods for adding questions:
- **Manual Entry:** Create questions directly in the system interface
- **Bulk Upload:** Upload questions via Excel/CSV template
  - Template shall include columns: Question Text, Question Type, Options (for MCQ), Correct Answer, Marks, Difficulty Level
  - System shall validate uploaded data and show errors if any
  - Support for up to 500 questions per upload
- **AI-Powered Question Generation (Future Scope - Phase 2):**
  - Input: Skill/topic, number of questions, difficulty level, focus points
  - AI generates relevant questions based on inputs
  - Admin/Trainer can review, edit, and approve AI-generated questions
  - System architecture shall support future AI integration

**FR-SA-003:** System shall support question types:
- Multiple Choice Questions (MCQ) with single/multiple correct answers
- Descriptive/Essay questions with manual grading capability
- True/False questions
- Fill in the blanks

**FR-SA-004:** System shall allow assessments to be mapped to:
- Specific job roles
- Individual skills/competencies
- Competency levels (Beginner/Intermediate/Advanced/Expert)

#### 6.3.2 Assessment Execution
**FR-SA-005:** System shall allow employees to:
- View assigned assessments
- Take assessments within the specified time window
- Save progress and resume later (if configured)
- Submit completed assessments

**FR-SA-006:** System shall auto-calculate scores for objective questions (MCQ, True/False).

**FR-SA-007:** System shall allow Trainer/Admin to manually grade descriptive answers.

**FR-SA-008:** **AI-Assisted Grading for Descriptive Answers (Future Scope - Phase 2):**
- AI shall analyze descriptive answers and suggest grades
- AI shall provide reasoning for suggested grade
- Trainer/Admin shall review AI suggestions and finalize grades
- System shall learn from Trainer/Admin corrections to improve future suggestions
- Manual override always available
- System architecture shall support future AI grading integration

**FR-SA-009:** System shall display assessment results showing:
- Total score
- Percentage
- Pass/Fail status
- Skill-wise breakdown
- Correct answers (after submission)

#### 6.3.3 Initial Assessment for New Employees
**FR-SA-010:** System shall trigger initial skill assessment immediately upon employee creation (Day 1-3).

**FR-SA-011:** System shall generate a baseline skill matrix based on initial assessment results.

**FR-SA-012:** Initial assessment results shall be used to customize the induction training plan.

---

### 6.4 Skill Gap Analysis & Training Need Analysis (TNA)

#### 6.4.1 Skill Gap Identification
**FR-SG-001:** System shall automatically identify skill gaps by comparing:
- Target/Desired competency level (defined per role)
- Actual competency level (from assessment scores)

**FR-SG-002:** System shall calculate gap percentage for each skill:
```
Gap % = ((Desired Score - Actual Score) / Desired Score) × 100
```

**FR-SG-003:** System shall categorize gaps as:
- Critical (Gap > 50%)
- High (Gap 30-50%)
- Medium (Gap 15-30%)
- Low (Gap < 15%)

**FR-SG-004:** System shall generate a Skill Gap Report showing:
- Employee name and role
- Skill/Competency name
- Desired level
- Current level
- Gap percentage
- Gap category
- Recommended training

#### 6.4.2 Training Need Analysis
**FR-SG-005:** System shall generate a Training Need Analysis (TNA) report containing:
- List of employees with skill gaps
- Skills requiring training
- Priority level
- Recommended training duration
- Suggested training resources

**FR-SG-006:** System shall allow Admin to:
- Review auto-generated TNA
- Modify training recommendations
- Set priority for training topics
- Approve training needs

**FR-SG-007:** System shall consolidate training needs across employees to identify:
- Common skill gaps
- Group training opportunities
- Resource requirements

---

### 6.5 Training Management Module

#### 6.5.1 Training Topic Creation
**FR-TM-001:** System shall allow Admin/Manager to create training topics with:
- Topic name
- Description and learning objectives
- Skill/Competency mapping
- Target audience (role/department/individual)
- Prerequisites (if any)

**FR-TM-002:** System shall support two training modes:
- **Online Training:** Self-paced learning using external resources
- **Offline Training:** Instructor-led classroom/virtual sessions

#### 6.5.2 Online Training Configuration
**FR-TM-003:** For online training, system shall allow configuration of:
- Training resources (YouTube links, Udemy courses, Coursera, articles, PDFs)
- Resource type (Video/Article/Course/Document)
- Estimated duration
- Target completion date
- Weekly progress update requirement

**FR-TM-004:** System shall allow Admin/Manager to assign a Mentor/Trainer for online training:
- Mentor can be the direct manager
- Mentor can be a designated subject matter expert
- Mentor assignment can be changed during training

**FR-TM-005:** System shall store all resource links and materials centrally for learner access.

#### 6.5.3 Offline Training Configuration
**FR-TM-006:** For offline training, system shall allow configuration of:
- Training date and time
- Duration (hours/days)
- Trainer name
- Training venue/location
- Virtual meeting link (if applicable)
- Maximum participants
- Training materials (upload PDFs, presentations)

**FR-TM-007:** System shall support batch-wise offline training with multiple sessions.

#### 6.5.4 Training Assignment
**FR-TM-008:** System shall allow training to be assigned to:
- Individual employees
- Groups of employees
- All employees in a role/department
- Custom employee lists

**FR-TM-009:** System shall automatically assign training based on:
- Identified skill gaps
- Approved TNA

**FR-TM-010:** System shall allow Manager/Admin to manually assign additional training topics to employees.

---

### 6.6 Training Calendar Module

#### 6.6.1 Calendar Generation
**FR-TC-001:** System shall automatically generate a training calendar containing:
- Training topic name
- Training mode (Online/Offline)
- Trainer/Mentor name
- Start date
- Target completion date
- Duration
- Training link/venue
- Assigned employees

**FR-TC-002:** System shall provide calendar views:
- Monthly calendar view
- Weekly agenda view
- List view with filters
- Individual employee calendar

**FR-TC-003:** System shall allow filtering by:
- Training mode
- Department
- Trainer
- Date range
- Training status

#### 6.6.2 Calendar Publishing
**FR-TC-004:** System shall allow Admin to publish the training calendar.

**FR-TC-005:** Once published, system shall automatically send email notifications to:
- Assigned employees
- Trainers/Mentors
- Managers (optional)

**FR-TC-006:** Published calendar shall be visible in the employee dashboard.

#### 6.6.3 Individual Training Record
**FR-TC-007:** System shall maintain individual training records for each employee showing:
- All assigned trainings (past and upcoming)
- Training status
- Completion dates
- Attendance records
- Assessment scores
- Feedback provided

---

### 6.7 Progress Tracking Module

#### 6.7.1 Online Training Progress
**FR-PT-001:** System shall require employees to update weekly progress for online training, including:
- Percentage completed
- Topics/modules completed
- Time spent
- Challenges faced (optional)
- Next week's plan

**FR-PT-002:** System shall allow Mentor/Manager to:
- View weekly progress updates
- Add comments/feedback on progress
- Mark progress as satisfactory/unsatisfactory

**FR-PT-003:** System shall display a progress dashboard showing:
- Overall completion percentage
- Week-by-week progress timeline
- Resources accessed
- Time remaining to target completion

#### 6.7.2 Offline Training Progress
**FR-PT-004:** For offline training, system shall automatically track:
- Attendance status
- Session completion
- Training completion date

#### 6.7.3 Progress Monitoring & Alerts
**FR-PT-005:** System shall allow Manager/Mentor/Admin to view:
- List of all learners under them
- Individual progress status
- Learners not making adequate progress (based on configurable thresholds)

**FR-PT-006:** System shall define "not making progress" as:
- No progress update for 2 consecutive weeks (online training)
- Completion percentage below expected trajectory
- Zero attendance in scheduled sessions (offline training)

**FR-PT-007:** System shall allow Manager/Mentor/Admin to trigger reminder notifications (email) to learners not making progress.

**FR-PT-008:** System shall send automated reminder emails:
- 7 days before target completion date
- 3 days before target completion date
- On target completion date (if incomplete)

#### 6.7.4 Training Completion
**FR-PT-009:** System shall allow employees to mark training as completed when:
- All modules/resources covered
- Target completion date reached or exceeded

**FR-PT-010:** For online training, completion requires:
- Final progress update marked as 100%
- **Proof of completion uploaded (mandatory)**
- Mentor/Manager approval (optional configuration)

**FR-PT-011:** System shall allow learners to upload proof of completion for online training:
- Course completion certificates (PDF, JPG, PNG)
- Screenshots of completion status
- Any other relevant documentation
- Multiple files can be uploaded (up to 5 files, max 10MB total)
- File preview and download capability

**FR-PT-012:** System shall validate uploaded proof:
- File format verification (PDF, JPG, PNG, JPEG)
- File size validation
- Virus scanning (if applicable)
- Storage with timestamp and uploader information

**FR-PT-013:** Mentor/Manager shall review uploaded proof and:
- Approve completion
- Reject with comments (requires re-upload)
- Request additional documentation

**FR-PT-014:** For offline training, completion is automatic upon:
- Attendance recorded for all sessions
- Minimum attendance threshold met (configurable)

**FR-PT-015:** System shall record:
- Start date (first progress update or first attendance)
- Completion date
- Total duration
- Status (Not Started/In Progress/Completed/Overdue)
- Proof of completion documents (for online training)

---

### 6.8 Attendance Management Module

#### 6.8.1 Attendance Recording
**FR-AM-001:** System shall allow Trainer/Admin to record attendance for offline training sessions:
- Select training session
- Mark attendance for each participant (Present/Absent/Late)
- Add remarks if needed
- Submit attendance

**FR-AM-002:** System shall allow bulk attendance upload via:
- Excel/CSV file upload
- Manual entry for all participants

**FR-AM-003:** System shall allow attendance correction/modification with audit trail.

#### 6.8.2 Attendance Tracking
**FR-AM-004:** System shall maintain attendance history showing:
- Training topic
- Session date
- Attendance status
- Trainer name

**FR-AM-005:** System shall calculate attendance percentage for each employee per training.

**FR-AM-006:** System shall flag low attendance (below configurable threshold, e.g., 75%).

---

### 6.9 Feedback Module

#### 6.9.1 Online Training Feedback
**FR-FB-001:** For online training, system shall collect feedback from Mentor/Manager on:
- Learner engagement and participation
- Quality of progress updates
- Learning effectiveness
- Areas of improvement
- Overall rating (1-5 scale)

**FR-FB-002:** System shall allow learner to provide feedback on:
- Resource quality and relevance
- Mentor support effectiveness
- Challenges faced
- Suggestions for improvement
- Overall satisfaction (1-5 scale)

#### 6.9.2 Offline Training Feedback
**FR-FB-003:** System shall automatically trigger feedback collection after offline training completion.

**FR-FB-004:** Feedback form for offline training shall include:
- Trainer effectiveness (1-5 scale)
  - Subject knowledge
  - Communication clarity
  - Engagement level
- Content usefulness (1-5 scale)
  - Relevance to role
  - Practical applicability
  - Content depth
- Training logistics (1-5 scale)
  - Venue/platform quality
  - Duration appropriateness
  - Materials quality
- Overall satisfaction (1-5 scale)
- Open-ended comments and suggestions

**FR-FB-005:** System shall send automated email reminders for pending feedback:
- 2 days after training completion
- 5 days after training completion (if still pending)

#### 6.9.3 Feedback Analysis
**FR-FB-006:** System shall generate feedback summary reports showing:
- Average ratings per category
- Trainer-wise effectiveness scores
- Topic-wise satisfaction scores
- Trend analysis over time
- Common themes from comments (manual review)

**FR-FB-007:** System shall flag trainings/trainers with consistently low ratings (below configurable threshold).

---

### 6.10 Post-Training Assessment Module

#### 6.10.1 Assessment Scheduling
**FR-PA-001:** System shall automatically trigger post-training assessment 30 days after training completion.

**FR-PA-002:** Assessment scheduling shall be configurable:
- Default: 30 days post-completion
- Admin can modify to 15/45/60 days
- Admin can trigger immediate re-assessment

**FR-PA-003:** System shall send email notification to employee 7 days before assessment due date.

#### 6.10.2 Assessment Execution & Scoring
**FR-PA-004:** Post-training assessment shall test the same skills/competencies as the initial assessment.

**FR-PA-005:** System shall automatically calculate and compare:
- Pre-training score
- Post-training score
- Improvement percentage
- Skill gap reduction

**FR-PA-006:** System shall determine training effectiveness:
```
Effectiveness = ((Post-Score - Pre-Score) / (Desired Score - Pre-Score)) × 100
```

**FR-PA-007:** System shall categorize improvement as:
- Significant Improvement (Effectiveness > 70%)
- Moderate Improvement (Effectiveness 40-70%)
- Minimal Improvement (Effectiveness 10-40%)
- No Improvement (Effectiveness < 10%)

#### 6.10.3 Skill Matrix Update
**FR-PA-008:** System shall automatically update employee skill matrix with post-training assessment scores.

**FR-PA-009:** If skill gap still exists after training, system shall:
- Identify residual gaps
- Flag for additional training
- Update TNA for next cycle

**FR-PA-010:** If employee achieves desired competency level, system shall:
- Mark skill as "Competent"
- Update skill matrix status
- Remove from active training pipeline for that skill

---

### 6.11 Skill Matrix Module

#### 6.11.1 Skill Matrix Structure
**FR-SM-001:** System shall maintain a comprehensive skill matrix for each employee containing:
- Skill/Competency name
- Skill category (Technical/Soft Skill/Domain Knowledge)
- Desired competency level (per role)
- Current competency level
- Skill gap (Desired - Current)
- Gap percentage
- Last assessed date
- Status (Competent/Gap Exists/Training Ongoing)

**FR-SM-002:** System shall define competency levels:
- Level 0: No Knowledge
- Level 1: Beginner (0-25%)
- Level 2: Intermediate (26-50%)
- Level 3: Advanced (51-75%)
- Level 4: Expert (76-100%)

#### 6.11.2 Matrix Updates
**FR-SM-003:** System shall automatically update skill matrix:
- After each assessment (initial, progress, post-training)
- When new skills are added to role requirements
- When desired competency levels change

**FR-SM-004:** System shall maintain skill matrix history showing:
- Date of assessment
- Score achieved
- Competency level at that time
- Training completed (if any)

#### 6.11.3 Visual Representation
**FR-SM-005:** System shall provide visual representation of skill matrix:
- **Heat Map:** Color-coded view of competency levels
  - Red: Critical gap (0-25% of desired)
  - Orange: High gap (26-50% of desired)
  - Yellow: Medium gap (51-75% of desired)
  - Green: Competent (76-100% of desired)
- **Spider/Radar Chart:** Multi-skill competency visualization
- **Bar Chart:** Skill-wise comparison of desired vs. actual

**FR-SM-006:** System shall allow comparison views:
- Individual employee: Current vs. Desired
- Team comparison: All team members' competency in a specific skill
- Role comparison: Average competency across roles

#### 6.11.4 Role-Based Competency Framework
**FR-SM-007:** System shall allow Admin to define role-based competency frameworks:
- Create job roles
- Define required skills per role
- Set desired competency level per skill
- Mark skills as mandatory/optional

**FR-SM-008:** When an employee's role changes, system shall:
- Update required skills based on new role
- Recalculate skill gaps
- Trigger assessment for new skills if needed

---

### 6.12 Notification Module

#### 6.12.1 Email Notifications
**FR-NT-001:** System shall send automated email notifications for the following events:

**All notifications in SKILL LOOP are sent via email to the respective user's registered email address.**

| Event | Recipient | Timing |
|-------|-----------|--------|
| New training assigned | Employee | Immediately upon assignment |
| Training calendar published | Employee, Trainer | Upon publication |
| Assessment scheduled | Employee | 7 days before & 1 day before |
| Weekly progress update due | Employee | Every week (e.g., Monday morning) |
| Progress update overdue | Employee, Manager | 2 days after due date |
| Feedback pending | Employee | 2 days & 5 days post-training |
| Post-training assessment due | Employee | 7 days before 30-day mark |
| Training completion approaching | Employee | 7 days & 3 days before target date |
| Training overdue | Employee, Manager | On target date +1 day |
| No progress detected | Employee | Triggered by Manager/Mentor |
| Skill gap identified | Employee, Manager | After assessment |
| Re-assessment required | Employee | As per schedule |
| Proof of completion uploaded | Mentor, Manager | Immediately upon upload |
| Proof of completion rejected | Employee | Upon rejection by Mentor |
| Mentor assigned | Employee, Mentor | Upon assignment |

**FR-NT-002:** All emails shall include:
- Clear subject line indicating purpose
- Recipient name (personalized)
- Relevant details (training name, date, link, etc.)
- Call-to-action button/link
- Sender identification (SKILL LOOP System)

**FR-NT-003:** System shall maintain notification history showing:
- Notification type
- Recipient
- Sent date/time
- Delivery status
- Read/unread status (if tracking enabled)

#### 6.12.2 In-App Notifications
**FR-NT-004:** System shall display in-app notifications in user dashboard for:
- Pending actions (assessments, feedback, progress updates)
- Upcoming training sessions
- New assignments
- Important announcements

**FR-NT-005:** Notification badge shall show count of unread notifications.

---

### 6.13 Reporting & Analytics Module

#### 6.13.1 Individual Reports
**FR-RP-001:** **Individual Training Report** shall include:
- Employee name, ID, role, department
- Training history (completed, ongoing, upcoming)
- Training completion rate
- Assessment scores (pre and post)
- Skill improvement metrics
- Attendance percentage
- Feedback ratings received
- Current skill matrix
- Pending actions

**FR-RP-002:** Report shall be available in:
- PDF format (downloadable)
- Excel format (downloadable)
- On-screen view

#### 6.13.2 Role-Wise Reports
**FR-RP-003:** **Role-Wise Competency Report** shall include:
- Role name and description
- Required skills/competencies
- Average competency level per skill across all employees in role
- Competency distribution (% of employees at each level)
- Common skill gaps
- Training completion rate for the role
- Top performers vs. skill gap outliers

#### 6.13.3 Training Effectiveness Reports
**FR-RP-004:** **Training Effectiveness Report** shall include:
- Training topic name
- Number of employees trained
- Average pre-training score
- Average post-training score
- Average improvement percentage
- Training effectiveness rating
- Feedback summary (trainer, content, logistics)
- Cost per training (if available)
- ROI metrics (if applicable)

**FR-RP-005:** Report shall identify:
- Most effective trainings (highest improvement)
- Least effective trainings (minimal improvement)
- Trainings requiring redesign

#### 6.13.4 Attendance Reports
**FR-RP-006:** **Attendance Report** shall include:
- Training topic and dates
- List of participants
- Session-wise attendance
- Overall attendance percentage
- Absent employees list
- Low attendance flagging

#### 6.13.5 Feedback Summary Reports
**FR-RP-007:** **Feedback Summary Report** shall include:
- Training topic
- Number of responses
- Average ratings (trainer, content, logistics, overall)
- Rating distribution (5-star breakdown)
- Positive highlights (from comments)
- Areas for improvement (from comments)
- Comparison with previous sessions

#### 6.13.6 Skill Gap Reports
**FR-RP-008:** **Organization-Wide Skill Gap Report** shall include:
- Department/Role-wise skill gap analysis
- Critical skills with highest gaps
- Number of employees with gaps per skill
- Priority skills requiring immediate training
- Trend analysis (gap reduction over time)
- Forecasted training needs

**FR-RP-009:** **Department/Team Skill Gap Report** shall include:
- Team composition
- Skill-wise gap analysis for the team
- Individual employee skill status
- Training pipeline for the team
- Estimated time to close gaps

#### 6.13.7 Dashboard & Analytics
**FR-RP-010:** System shall provide an **Admin Dashboard** with:
- Total employees enrolled
- Active trainings count
- Pending assessments count
- Average skill gap percentage
- Training completion rate
- Upcoming trainings (next 7/30 days)
- Recent feedback scores
- Alerts and notifications

**FR-RP-011:** System shall provide a **Manager Dashboard** with:
- Team member count
- Team skill gap summary
- Team members not making progress
- Pending mentor reviews
- Upcoming team trainings
- Team average skill improvement

**FR-RP-012:** System shall provide an **Employee Dashboard** with:
- Assigned trainings (status-wise)
- Upcoming assessments
- Skill matrix visualization
- Training completion percentage
- Pending actions (feedback, progress update)
- Training calendar
- Recent assessment scores

**FR-RP-013:** All reports shall have:
- Date range filters
- Export functionality (PDF, Excel)
- Print option
- Scheduled report generation (weekly/monthly email)

---

## 7. Non-Functional Requirements

### 7.1 Performance
- **NFR-PF-001:** System shall support concurrent access by at least 500 users.
- **NFR-PF-002:** Page load time shall not exceed 3 seconds under normal load.
- **NFR-PF-003:** Assessment submission shall process within 2 seconds.
- **NFR-PF-004:** Report generation shall complete within 30 seconds for up to 1000 records.

### 7.2 Usability
- **NFR-US-001:** User interface shall be intuitive requiring minimal training.
- **NFR-US-002:** System shall be accessible via web browsers (Chrome, Firefox, Edge, Safari).
- **NFR-US-003:** System shall be mobile-responsive for access on smartphones and tablets.
- **NFR-US-004:** System shall provide contextual help and tooltips.

### 7.3 Security
- **NFR-SC-001:** System shall implement role-based access control (RBAC).
- **NFR-SC-002:** All passwords shall be encrypted using industry-standard encryption.
- **NFR-SC-003:** System shall implement session timeout after 30 minutes of inactivity.
- **NFR-SC-004:** System shall maintain audit logs for critical operations.
- **NFR-SC-005:** System shall implement secure HTTPS communication.

### 7.4 Reliability
- **NFR-RL-001:** System uptime shall be 99.5% or higher.
- **NFR-RL-002:** System shall perform daily automated backups.
- **NFR-RL-003:** Data recovery process shall be in place with RTO < 4 hours.

### 7.5 Scalability
- **NFR-SL-001:** System shall scale to support up to 5,000 users without performance degradation.
- **NFR-SL-002:** Database shall support up to 1 million assessment records.

### 7.6 Compliance
- **NFR-CM-001:** System shall comply with data privacy regulations (GDPR/local laws).
- **NFR-CM-002:** Employee data shall be stored securely with appropriate access controls.

---

## 8. Technical Specifications

### 8.1 Recommended Technology Stack
- **Frontend:** React.js or Angular
- **Backend:** Node.js with Express or Python with Django/Flask
- **Database:** PostgreSQL or MySQL
- **Email Service:** SMTP integration or cloud service (SendGrid, AWS SES)
- **File Storage:** Cloud storage (AWS S3, Azure Blob) or local server
- **Authentication:** JWT-based authentication
- **Reporting:** Libraries like Chart.js, D3.js for visualizations

### 8.2 Integration Requirements
- **Email Integration:** SMTP server for automated notifications
- **Calendar Integration:** Optional integration with Google Calendar, Outlook (future enhancement)
- **SSO Integration:** Optional Single Sign-On integration (future enhancement)

---

## 9. User Interface Requirements

### 9.1 Key Screens
1. **Login Screen:** Secure authentication
2. **Dashboard:** Role-specific landing page with key metrics and pending actions
3. **Skill Matrix View:** Visual representation of skills
4. **Assessment Screen:** Question display and submission interface
5. **Training Calendar:** Calendar view of all trainings
6. **Progress Update Form:** Weekly progress entry for online training
7. **Feedback Form:** Post-training feedback collection
8. **Reports Section:** Access to all reports with filters
9. **Admin Panel:** User management, configuration, and system settings
10. **Notifications Center:** View all notifications and alerts

### 9.2 Design Principles
- Clean, modern interface with consistent branding
- Minimal clicks to complete common tasks
- Clear navigation with breadcrumbs
- Visual indicators for status (color-coded)
- Responsive design for mobile access
- Accessibility compliance (WCAG 2.1 Level AA)

---

## 13. Key Workflows

### 13.1 Online Training Workflow with Proof Upload

```
Training Assigned (with external resources)
    ↓
Mentor Assigned to Learner
    ↓
Learner Accesses Resources (YouTube/Udemy/Coursera/Links)
    ↓
Week 1: Learner Updates Progress (% complete, topics covered, time spent)
    ↓
Mentor Reviews Progress & Provides Feedback
    ↓
Week 2-N: Repeat Progress Updates & Reviews
    ↓
If No Progress Detected (2 consecutive weeks):
    → Mentor/Manager Triggers Reminder Email
    → Escalation to Manager if continues
    ↓
Learner Completes Training (100% progress)
    ↓
Learner Uploads Proof of Completion
    (Certificate/Screenshot/Documentation)
    ↓
Mentor Receives Email Notification
    ↓
Mentor Reviews Proof
    ├─ Approved → Training Marked Complete
    └─ Rejected → Email to Learner → Re-upload Required
    ↓
Training Completion Recorded
    ↓
Feedback Triggered (from Mentor on learner performance)
    ↓
30-Day Post-Training Assessment Scheduled
```

### 13.2 AI-Enhanced Assessment Creation

```
Admin Decides to Create Assessment
    ↓
Chooses Creation Method:
    ├─ Manual Entry → Create questions one by one
    │
    ├─ Bulk Upload → Upload Excel/CSV template
    │                 ↓
    │              System validates data
    │                 ↓
    │              Questions imported to bank
    │
    └─ AI Generation → Enter: Skill, # Questions, Difficulty, Focus Points
                        ↓
                    AI Generates Question Bank
                        ↓
                    Admin Reviews AI Questions
                        ↓
                    Edit/Approve/Reject/Regenerate Questions
                        ↓
                    Finalize Question Bank
    ↓
Assessment Created & Assigned to Employees
    ↓
Employees Take Assessment
    ↓
MCQs Auto-Graded
    ↓
Descriptive Answers → AI Suggests Grade with Feedback
                        ↓
                    Trainer Reviews AI Suggestion
                        ↓
                    Accept/Modify/Override AI Grade
                        ↓
                    Add Additional Feedback
                        ↓
                    Final Grade Published
    ↓
Results Published & Skill Matrix Updated
```

---



---

## 15. Assumptions & Dependencies

### 15.1 Assumptions
- Employees have access to internet for online training resources
- Employees have valid email addresses for notifications
- External training platforms (YouTube, Udemy, Coursera) remain accessible
- Managers/Mentors will dedicate time for progress reviews
- Assessment questions are validated for accuracy before assignment

### 15.2 Dependencies
- SMTP server or email service for notifications
- Cloud/server storage for documents and proof uploads
- Database server for data persistence
- External training platform availability (for online training)
- Active involvement of Admins, Trainers, and Managers
- AI service/API for question generation and answer grading

---

## 16. Risks & Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
| Low employee engagement with progress updates | High | Automated reminders, manager escalations, gamification (future) |
| External training resources become unavailable | Medium | Store backup resources, maintain multiple sources per skill |
| Mentors/Managers too busy to review progress | High | Set SLAs for review, escalation mechanism, dedicated review time slots |
| Fake proof of completion uploads | Medium | Mentor verification required, random audits |
| Assessment question quality issues | High | Review process, pilot testing, continuous question bank improvement |
| Email delivery failures | Medium | Retry mechanism, in-app notifications as backup |
| AI-generated questions inaccurate | Medium | Mandatory human review and approval, feedback mechanism for improvement |
| AI grading errors for descriptive answers | Medium | Trainer always reviews and can override, confidence scoring helps flag uncertain grades |
| System downtime during critical training periods | High | High availability architecture, regular backups, disaster recovery plan |

---

## 17. Glossary

| Term | Definition |
|------|------------|
| **Competency Level** | Measure of proficiency in a skill (Beginner/Intermediate/Advanced/Expert) |
| **Skill Gap** | Difference between desired and current competency level |
| **TNA** | Training Need Analysis - systematic identification of training requirements |
| **Skill Matrix** | Comprehensive view of all skills, desired levels, and current levels for an employee |
| **Mentor** | Subject matter expert assigned to guide learner through online training |
| **Proof of Completion** | Documentation (certificate/screenshot) showing training completion |
| **Induction Training** | Structured onboarding program for new employees |
| **Online Training** | Self-paced learning using external resources (courses, videos, articles) |
| **Offline Training** | Instructor-led training conducted in-person or via live virtual sessions |
| **Post-Training Assessment** | Evaluation conducted 30 days after training to measure retention and improvement |
| **Training Cycle** | Complete loop from assessment → training → re-assessment → skill matrix update |
| **AI Question Generation** | Automated creation of assessment questions based on skill, difficulty, and focus areas |
| **AI-Assisted Grading** | Automated evaluation of descriptive answers with trainer review and approval |

---

## 18. Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2026 | L&D Team | Initial PRD with AI-powered assessment and grading features |

---

**End of Document**

The SKILL LOOP system is designed with a modular architecture that allows for future AI-powered enhancements. While these features will be implemented in Phase 2 (post-initial launch), the development architecture must accommodate these integrations.

### 11.1 AI-Powered Features

#### 11.1.1 Intelligent Assessment Generation
**AI-ASSESS-001:** AI-powered question generation system
- **Input Parameters:**
  - Skill/Topic name
  - Number of questions required
  - Difficulty level (Beginner/Intermediate/Advanced/Expert)
  - Question types (MCQ/Descriptive/True-False)
  - Focus areas/sub-topics
  - Learning objectives
  
- **AI Processing:**
  - Generate contextually relevant questions
  - Ensure variety in question patterns
  - Balance difficulty distribution
  - Avoid repetitive questions
  
- **Output:**
  - Question bank with suggested answers
  - Explanation for each answer
  - Difficulty rating per question
  
- **Human Oversight:**
  - Admin/Trainer reviews all AI-generated questions
  - Edit, approve, or reject questions
  - Fine-tune difficulty levels
  - Add/modify options and answers

#### 11.1.2 Automated Descriptive Answer Grading
**AI-GRADE-001:** AI-assisted grading for essay/descriptive questions
- **Input:**
  - Question text
  - Model/reference answer
  - Grading rubric
  - Student's submitted answer
  
- **AI Analysis:**
  - Content relevance assessment
  - Key concept identification
  - Completeness evaluation
  - Language quality check
  
- **Output:**
  - Suggested grade/score
  - Detailed feedback on strengths and weaknesses
  - Highlighting of missing concepts
  - Confidence level of AI grading
  
- **Human Validation:**
  - Trainer reviews AI suggestions
  - Adjusts grades if needed
  - Provides additional feedback
  - System learns from trainer corrections



### 11.4 Development Guidelines for AI-Readiness

**DEV-AI-001:** Developers must follow these principles to ensure AI-readiness:

1. **Clean Data Architecture:**
   - Consistent data formats and naming conventions
   - Comprehensive data validation at entry points
   - Audit trails for all data modifications
   - Metadata tagging for all content

2. **API-First Development:**
   - All features accessible via well-documented APIs
   - Versioned APIs to support evolution
   - Standardized request/response formats
   - Rate limiting and throttling capabilities

3. **Extensible Design:**
   - Plugin architecture for AI modules
   - Configuration-driven feature flags
   - Minimal hardcoding of business logic
   - Dependency injection for service components

4. **Scalable Infrastructure:**
   - Stateless application design
   - Horizontal scaling capability
   - Message queue support for async processing
   - Distributed caching mechanisms

5. **Monitoring & Observability:**
   - Comprehensive logging framework
   - Performance metrics collection
   - User interaction tracking (with consent)
   - Error tracking and alerting

---

## 12. Data Model (Key Entities)

1. **User:** user_id, name, email, role, department, job_role, date_of_joining
2. **Skill:** skill_id, skill_name, category, description
3. **Assessment:** assessment_id, title, skill_id, total_marks, passing_score, duration
4. **Question:** question_id, assessment_id, question_text, question_type, options, correct_answer, marks, difficulty_level, ai_generated (boolean)
5. **Assessment_Result:** result_id, assessment_id, user_id, score, percentage, status, completed_date
6. **Skill_Matrix:** matrix_id, user_id, skill_id, desired_level, current_level, gap_percentage, last_assessed_date, status
7. **Training_Topic:** topic_id, topic_name, description, mode (online/offline), duration, skill_id
8. **Training_Assignment:** assignment_id, topic_id, user_id, trainer_id, mentor_id, start_date, target_completion_date, status
9. **Training_Progress:** progress_id, assignment_id, week_number, completion_percentage, update_date, challenges, next_plan, mentor_comments
10. **Completion_Proof:** proof_id, assignment_id, file_name, file_path, upload_date, status (pending/approved/rejected), reviewer_comments
11. **Training_Resource:** resource_id, topic_id, resource_name, resource_type, resource_link, uploaded_file
12. **Training_Calendar:** calendar_id, topic_id, training_date, venue, meeting_link, max_participants
13. **Attendance:** attendance_id, calendar_id, user_id, status (present/absent/late), remarks
14. **Feedback:** feedback_id, training_assignment_id, submitted_by, trainer_rating, content_rating, logistics_rating, overall_rating, comments
15. **Notification:** notification_id, recipient_id, type, subject, message, sent_date, read_status
16. **Training_Need_Analysis:** tna_id, user_id, skill_id, gap_identified_date, priority, approved_by, status
17. **Role_Competency:** competency_id, job_role, skill_id, required_level, is_mandatory
18. **Induction_Configuration:** config_id, role_type, total_duration, phase_count, phase_details (JSON)