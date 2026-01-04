# QuizApp Architecture & System Design

## 📐 Overall System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USERS                                      │
│                    ┌─────────────────┐                             │
│                    │   Teachers      │                             │
│                    │   Students      │                             │
│                    │   Admins        │                             │
│                    └────────┬────────┘                             │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
                              │ HTTPS
                              ↓
        ┌─────────────────────────────────────────────┐
        │                                             │
        │        Next.js 14 Application               │
        │     (Frontend + Backend in One)            │
        │                                             │
        │  ┌─────────────────────────────────────┐  │
        │  │      React Components               │  │
        │  │  - Landing Page                     │  │
        │  │  - Auth Pages (Login/Register)      │  │
        │  │  - Teacher Dashboard                │  │
        │  │  - Student Dashboard                │  │
        │  │  - Test Interfaces                  │  │
        │  │  - Results Pages                    │  │
        │  └─────────────────────────────────────┘  │
        │                    ↓                       │
        │  ┌─────────────────────────────────────┐  │
        │  │      Next.js API Routes             │  │
        │  │  /api/auth/*                        │  │
        │  │  /api/teacher/*                     │  │
        │  │  /api/student/*                     │  │
        │  │  /api/tests/*                       │  │
        │  │  /api/reports/*                     │  │
        │  └─────────────────────────────────────┘  │
        │                                            │
        └────────────────┬──────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ↓                                 ↓
   ┌──────────────┐              ┌──────────────┐
   │   MongoDB    │              │  Gemini API  │
   │   Database   │              │  (Google AI) │
   │              │              │              │
   │ - Users      │              │ - Question   │
   │ - Classes    │              │   generation │
   │ - Tests      │              │ - Grading    │
   │ - Results    │              │ - Cheating   │
   │ - Analytics  │              │   detection  │
   └──────────────┘              └──────────────┘
```

---

## 🗄️ Database Schema Relationships

```
User (Base Entity)
├── _id (ObjectId)
├── email (String, unique)
├── password (String, hashed)
├── firstName (String)
├── lastName (String)
├── role (Enum: teacher, student, admin)
├── phone (String, optional)
├── profileImage (String, optional)
└── timestamps

Class
├── _id (ObjectId)
├── name (String)
├── description (String)
├── teacherId (ObjectId → User)
├── code (String, unique)
├── students (Array of ObjectIds → User)
└── timestamps

Test
├── _id (ObjectId)
├── title (String)
├── description (String)
├── teacherId (ObjectId → User)
├── classId (ObjectId → Class)
├── questions (Array of embedded objects)
│   ├── type (Enum: multiple_choice, short_answer, true_false, essay)
│   ├── question (String)
│   ├── options (Array of Strings)
│   ├── correctAnswer (String)
│   ├── explanation (String)
│   ├── difficulty (Enum: easy, medium, hard)
│   └── marks (Number)
├── duration (Number, minutes)
├── difficulty (Enum: easy, medium, hard)
├── isPublished (Boolean)
├── startTime (Date, optional)
├── endTime (Date, optional)
├── totalMarks (Number)
├── showAnswers (Boolean)
└── timestamps

TestResult
├── _id (ObjectId)
├── testId (ObjectId → Test)
├── studentId (ObjectId → User)
├── classId (ObjectId → Class)
├── answers (Array of embedded objects)
│   ├── questionId (ObjectId)
│   ├── answer (String)
│   ├── isCorrect (Boolean)
│   ├── marksObtained (Number)
│   └── timeSpent (Number, seconds)
├── totalMarks (Number)
├── obtainedMarks (Number)
├── percentage (Number)
├── status (Enum: submitted, grading, graded)
├── cheatingScore (Number, 0-100)
├── cheatingDetails (String, optional)
├── attemptNumber (Number)
├── startedAt (Date)
├── submittedAt (Date)
└── timestamps
```

---

## 🔄 Authentication Flow

```
User Registration
    ↓
Input Validation → Email check → Password hash
    ↓
Store User in DB
    ↓
Redirect to Login

User Login
    ↓
Email & password validation
    ↓
Password comparison (bcryptjs)
    ↓
Generate JWT token
    ↓
Return token + user data
    ↓
Store token in localStorage (should be httpOnly cookie)
    ↓
Redirect to dashboard (based on role)

Protected Routes
    ↓
Extract token from headers
    ↓
Verify token signature
    ↓
Check token expiration
    ↓
Extract user info (userId, role, email)
    ↓
Verify role permissions
    ↓
Allow/Deny access
```

---

## 📝 Test Taking Flow

```
Student Views Available Tests
    ↓
Clicks "Start Test"
    ↓
Test Timer Starts (full-screen mode)
    ↓
Visibility API monitors tab switch
    ├─ User leaves tab → Auto-submit triggered
    ├─ Browser loses focus → Auto-submit triggered
    └─ Timer expires → Auto-submit triggered
    ↓
Student Answers Questions
    ├─ Answers are saved to local state
    ├─ Auto-save every answer change
    └─ Show unsaved indicator
    ↓
Student Reviews Answers (if allowed)
    ↓
Student Clicks Submit
    ↓
Confirmation Dialog
    ↓
Disable all inputs (prevent further changes)
    ↓
Send Answers to Server
    ↓
Server Grades Test
    ├─ MCQ: Compare with correct answer
    ├─ Short Answer: Use Gemini API
    └─ Essay: Use Gemini API
    ↓
Server Detects Cheating
    ├─ Analyze answer patterns
    ├─ Check submission timing
    ├─ Generate cheating score
    └─ Flag if suspicious
    ↓
Store Result in Database
    ↓
Return Result Summary
    ↓
Redirect to Results Page
```

---

## 🎯 Test Generation Workflow

```
Teacher Selects Source Type
    ├─ PDF File
    ├─ Image File
    ├─ Document File
    ├─ PowerPoint
    └─ Web Search Query
    ↓
File Upload/Input Processing
    ├─ PDF → pdf-parse library
    ├─ Image → Tesseract OCR
    ├─ Document → DOCX parser
    ├─ PowerPoint → PPTX parser
    └─ Web → Search + scrape
    ↓
Extract Text Content
    ↓
Clean & Normalize Text
    ↓
Send to Gemini API
    ├─ "Generate X questions"
    ├─ "Difficulty level: Y"
    └─ "Question types: Z"
    ↓
Receive Generated Questions from Gemini
    ├─ Parse JSON response
    ├─ Validate structure
    └─ Extract questions
    ↓
Preview Questions to Teacher
    ├─ Display all questions
    ├─ Edit/Delete options
    └─ Add manual questions
    ↓
Save to Database
    ↓
Ready for Publishing
```

---

## 📊 Auto-Grading Process

```
Test Submitted
    ↓
For Each Question
    ├─ Multiple Choice/True-False
    │  ├─ Compare answer case-insensitive
    │  ├─ Award full marks if correct
    │  └─ Award 0 if incorrect
    │
    └─ Short Answer/Essay
       ├─ Send to Gemini API with:
       │  ├─ Question text
       │  ├─ Student answer
       │  └─ Sample/Correct answer
       ├─ Receive from Gemini:
       │  ├─ isCorrect (boolean)
       │  ├─ score (0-100%)
       │  └─ feedback (string)
       └─ Calculate marks (score% × question marks)
    ↓
Sum Total Marks
    ↓
Calculate Percentage
    ↓
Assign Grade (A/B/C/D/F)
    ↓
Store Result with Status: "graded"
```

---

## 🚨 Cheating Detection Algorithm

```
Collect Test Metadata
├─ Test duration
├─ Time spent by student
├─ All answers submitted
└─ Answer timestamps

Analyze Time Patterns
├─ Average time per question
├─ Suspiciously fast answers (< 2 sec)
├─ Suspiciously slow answers
└─ Inconsistent timing

Analyze Answer Patterns
├─ All correct answers (statistically unlikely)
├─ All wrong answers
├─ Identical answers to previous test
├─ Perfect answer consistency (copy-paste indicator)
└─ Unusual writing style changes

Analyze Submission Metadata
├─ Tab switching detected
├─ Focus loss detected
├─ Multiple submissions
└─ Submission timestamp analysis

Send to Gemini API
├─ Provide answer data
├─ Provide time data
├─ Request cheating assessment
└─ Receive cheating score (0-100)

Generate Cheating Score
├─ 0-20: Very unlikely to be cheating
├─ 21-40: Low suspicion
├─ 41-60: Moderate suspicion
├─ 61-80: High suspicion
└─ 81-100: Very high suspicion

Flag Test if Needed
├─ Score > 60: Flag for manual review
├─ Send notification to teacher
└─ Store cheating details
```

---

## 📈 Data Flow for Analytics

```
Test Completed
    ↓
Result Stored in Database
    ↓
Calculate Metrics
├─ Student score
├─ Class average
├─ Question difficulty stats
├─ Performance by topic
└─ Improvement trends
    ↓
Generate Reports
├─ Individual student report
├─ Class performance report
├─ Subject-wise analysis
└─ Trend analysis
    ↓
Create Visualizations
├─ Score distribution chart
├─ Performance trend graph
├─ Difficulty vs accuracy
└─ Student ranking chart
    ↓
Export Options
├─ PDF report
├─ Excel spreadsheet
├─ Email report
└─ Print report
```

---

## 🏆 Leaderboard Calculation

```
For Each Test
    ↓
For Each Student Taking Test
    ├─ Get test result
    ├─ Extract obtainedMarks
    ├─ Calculate percentage
    └─ Store in temp array
    ↓
Sort by Average Score (Descending)
    ↓
Break Ties
├─ If same average: use total marks
├─ If still same: use number of tests
└─ If still same: use earliest date
    ↓
Assign Positions
├─ 1st position → 🥇
├─ 2nd position → 🥈
├─ 3rd position → 🥉
└─ Rest → Number positions
    ↓
Calculate Achievements
├─ Perfect scores
├─ Improvement streaks
├─ Consistency badges
└─ Challenge badges
    ↓
Display Leaderboard
├─ Rank with emoji
├─ Student name
├─ Average score
├─ Total tests taken
└─ Badges earned
```

---

## 🔗 API Communication Pattern

```
Frontend Component
    ↓ (calls)
api.post('/endpoint', data)
    ↓ (includes token in header)
Authorization: Bearer {JWT_TOKEN}
    ↓
Next.js API Route
    ↓ (extracts token)
extractTokenFromHeader()
    ↓ (verifies token)
verifyToken()
    ↓ (extracts user info)
userId, email, role
    ↓ (checks authorization)
protectedRoute(request, 'teacher')
    ↓ (connects to database)
connectDB()
    ↓ (performs database operation)
User.findOne(), Class.save(), etc.
    ↓ (returns result)
NextResponse.json()
    ↓ (client receives response)
Frontend updates state
    ↓ (triggers UI update)
Component re-renders
```

---

## 🔐 Security Layers

```
Application Level
├─ JWT Token validation
├─ Role-based access control
├─ Input validation
└─ Output encoding

Database Level
├─ MongoDB authentication
├─ User permissions
├─ Query sanitization
└─ Encrypted fields

Network Level
├─ HTTPS/TLS
├─ CORS headers
├─ Rate limiting
└─ WAF rules

Infrastructure Level
├─ Firewall rules
├─ DDoS protection
├─ Intrusion detection
└─ Security groups
```

---

## 📱 Component Hierarchy

```
App Root
├─ Layout (RootLayout)
│  ├─ NotificationProvider (Toast/Alerts)
│  └─ Metadata
│
├─ Auth Routes (/auth/*)
│  ├─ AuthLayout
│  ├─ RegisterPage
│  └─ LoginPage
│
├─ Teacher Routes (/teacher/*)
│  ├─ DashboardPage
│  ├─ ClassesPage
│  │  └─ ClassForm
│  │  └─ ClassList
│  ├─ TestsPage
│  │  └─ TestBuilder
│  │  └─ TestList
│  ├─ AnalyticsPage
│  │  └─ Charts
│  │  └─ Reports
│  └─ ResultCardsPage
│
└─ Student Routes (/student/*)
   ├─ DashboardPage
   ├─ TestsPage
   ├─ TestPage (with TestInterface)
   │  ├─ Timer
   │  ├─ QuestionCard
   │  ├─ AnswerForm
   │  └─ NavigationPanel
   ├─ ResultsPage
   └─ LeaderboardPage
```

---

## 🚀 Deployment Architecture

```
Production Environment
    ↓
Vercel/AWS/Digital Ocean
    ├─ Next.js Application
    ├─ Node.js Runtime
    └─ Environment Variables
    ↓
Database
├─ MongoDB Atlas (Cloud)
└─ Automated Backups
    ↓
External Services
├─ Gemini API (Google)
└─ Email Service (Optional)
    ↓
CDN
├─ Static Assets
├─ Images
└─ Stylesheets
    ↓
Monitoring & Logging
├─ Error tracking
├─ Performance monitoring
└─ Analytics
```

---

**This architecture provides:**
- ✅ Scalability
- ✅ Security
- ✅ Performance
- ✅ Maintainability
- ✅ Reliability

Last Updated: January 4, 2026
