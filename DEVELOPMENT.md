# QuizApp Development Guide

## Project Status

This is the initial scaffold for the Quiz App system. The foundation includes:

✅ **Completed**:
- Project structure and file organization
- Database models (User, Class, Test, TestResult)
- Authentication system (Register/Login)
- Type definitions
- UI Components (Button, Card, Input)
- Teacher Dashboard (UI)
- Student Dashboard (UI)
- Home page with feature showcase
- Global styling and Tailwind config

## Next Steps - Features to Implement

### 1. **Teacher Features**

#### Create Test Page
- File: `src/app/teacher/create-test/page.tsx`
- Features:
  - Test generation from PDFs, images, documents
  - Web research-based generation
  - Question builder interface
  - Difficulty level selection
  - Time limit setting
  - Preview and publish

#### Class Management
- File: `src/app/teacher/classes/page.tsx`
- Features:
  - Create new classes
  - Generate unique class codes
  - View enrolled students
  - Add/remove students
  - View class performance statistics

#### Test Management
- File: `src/app/teacher/tests/page.tsx`
- Features:
  - View all created tests
  - Publish/unpublish tests
  - Set test timing (start/end time)
  - Configure test settings
  - View test submissions

#### Analytics & Reports
- File: `src/app/teacher/analytics/page.tsx`
- Features:
  - Class-wise performance reports
  - Student-wise progress tracking
  - Question difficulty analysis
  - Performance trends
  - Export reports (PDF, Excel)

#### Result Cards Generator
- File: `src/app/teacher/result-cards/page.tsx`
- Features:
  - Generate professional result cards
  - Customize card design
  - Include student photo
  - Display scores and grades
  - Download/print certificates

### 2. **Student Features**

#### Available Tests
- File: `src/app/student/tests/page.tsx`
- Features:
  - List of available tests
  - Test details (duration, questions, difficulty)
  - Join class functionality
  - Filter by class/subject

#### Test Taking Interface
- File: `src/app/student/test/[id]/page.tsx`
- Features:
  - Full-screen test mode
  - Auto-submission on tab switch
  - Timer with warnings
  - Question navigation
  - Answer review (if allowed)
  - Submit test

#### Results Viewing
- File: `src/app/student/results/page.tsx`
- Features:
  - View test results
  - Score breakdown by question
  - Correct answers (if shown)
  - Performance statistics
  - Download result card

#### Leaderboard
- File: `src/app/student/leaderboard/page.tsx`
- Features:
  - Class-wise rankings
  - Subject-wise rankings
  - Performance metrics
  - Achievement badges
  - Comparison with classmates

### 3. **Core Features to Implement**

#### Auto-Submission System
- Detect tab switching using Visibility API
- Automatically submit when:
  - Student leaves the tab
  - Browser loses focus
  - Timer expires
- Warn student before submission

#### Cheating Detection
- Analyze answer patterns
- Check for suspicious submission times
- Detect copy-paste patterns
- Flag unusual answer consistency
- Generate cheating score (0-100)

#### Test Generation from Sources
- **PDF Processing**:
  - Extract text from PDFs
  - Parse structured content
  - Generate questions from content

- **Image Processing**:
  - OCR for text extraction
  - Visual content understanding
  - Question generation

- **Document Processing**:
  - Word/DOCX parsing
  - Content extraction
  - Question creation

- **PowerPoint Processing**:
  - Slide extraction
  - Text and image analysis
  - Question generation

- **Web Research**:
  - Search query processing
  - Content scraping
  - Question synthesis

#### AI Integration (Gemini API)
- Question generation from text
- Auto-grading short answers
- Essay evaluation
- Cheating detection analysis
- Question quality assessment
- Answer explanation generation

#### Result Management
- Store test results in database
- Calculate percentage and grades
- Generate detailed report cards
- Create visual performance charts
- Export results in multiple formats

#### Class Management
- Teacher can create classes
- Generate class join codes
- Approve/reject student requests (optional)
- View class statistics
- Manage test assignments
- Track class progress

### 4. **Database API Routes to Create**

```
/api/teacher/
  - /create-test (POST)
  - /update-test (PUT)
  - /delete-test (DELETE)
  - /publish-test (POST)
  - /get-tests (GET)
  - /get-test/:id (GET)

/api/teacher/classes/
  - /create-class (POST)
  - /update-class (PUT)
  - /get-classes (GET)
  - /get-class/:id (GET)
  - /add-student (POST)
  - /remove-student (POST)
  - /get-class-report/:id (GET)

/api/student/
  - /get-available-tests (GET)
  - /take-test/:id (GET)
  - /submit-test (POST)
  - /get-results (GET)
  - /get-result/:id (GET)
  - /join-class (POST)

/api/tests/
  - /generate-from-pdf (POST)
  - /generate-from-image (POST)
  - /generate-from-web (POST)
  - /grade-test (POST)
  - /detect-cheating (POST)

/api/results/
  - /generate-report (POST)
  - /generate-result-card (POST)
  - /export-results (GET)
```

### 5. **UI Components to Create**

- `src/components/teacher/TestBuilder.tsx`
- `src/components/teacher/ClassForm.tsx`
- `src/components/teacher/TestList.tsx`
- `src/components/teacher/AnalyticsChart.tsx`
- `src/components/student/TestInterface.tsx`
- `src/components/student/QuestionCard.tsx`
- `src/components/student/Timer.tsx`
- `src/components/common/ResultCard.tsx`
- `src/components/common/Leaderboard.tsx`
- `src/components/common/FileUploader.tsx`

### 6. **Utility Functions to Create**

- `src/lib/fileProcessor.ts` - Handle PDF, image, document processing
- `src/lib/testGrader.ts` - Auto-grading logic
- `src/lib/cheatingDetector.ts` - Cheating analysis
- `src/lib/reportGenerator.ts` - Generate reports and cards
- `src/lib/api-client.ts` - API communication wrapper

### 7. **Configuration Files Needed**

- Create MongoDB collections indexes in seed script
- Set up environment variables (see `.env.local.example`)
- Configure Gemini API credentials
- Set up file upload storage (Cloudinary or local)

## Installation & Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)
- Google Gemini API key
- npm or yarn

### Steps

1. **Clone/Setup Project**
```bash
cd "d:\Quiz App 2"
npm install
```

2. **Configure Environment**
```bash
# Copy and edit environment file
cp .env.local.example .env.local

# Fill in:
# - MONGODB_URI
# - GEMINI_API_KEY
# - NEXTAUTH_SECRET
```

3. **Run Development Server**
```bash
npm run dev
```

4. **Open in Browser**
```
http://localhost:3000
```

## Testing the Application

### Test Accounts
- Teacher: teacher@example.com / Password123
- Student: student@example.com / Password123

### Sample Test Cases
1. Register as teacher → Create class → Create test
2. Register as student → Join class → Take test
3. View results and analytics

## Important Notes

- **Security**: Change NEXTAUTH_SECRET in production
- **Database**: Set up MongoDB connection properly
- **API Keys**: Keep Gemini API key secure
- **File Uploads**: Configure proper file storage solution
- **CORS**: Configure if frontend/backend are separate

## Folder Structure Summary

```
d:\Quiz App 2\
├── src/
│   ├── app/                  # Next.js pages and routes
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utility functions
│   ├── models/               # MongoDB schemas
│   ├── types/                # TypeScript definitions
│   └── styles/               # Global CSS
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Support & Documentation

For questions about specific features, refer to:
- TypeScript types: `src/types/index.ts`
- Database models: `src/models/`
- API routes: `src/app/api/`
- Components: `src/components/`

---

**Last Updated**: January 4, 2026
**Version**: 1.0.0 (Scaffolding Phase)
