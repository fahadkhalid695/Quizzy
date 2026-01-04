# 🎓 Quiz App - Dynamic Quiz Management System

A complete, production-ready quiz platform with AI-powered features, real-time leaderboards, and cheating detection.

## ✨ Features

- **Authentication**: Secure registration and login for teachers and students
- **Class Management**: Create classes, manage students, generate unique class codes
- **Test Creation**: Build tests with multiple question types (MCQ, True/False, Short Answer, Essay)
- **Test Taking**: Full-screen interface with countdown timer and tab-switching detection
- **Auto-Grading**: Instant grading for objective questions, AI-powered grading for essays
- **Results & Feedback**: Detailed score breakdown, question-by-question review, explanations
- **Leaderboards**: Real-time class rankings with top 3 medals
- **AI Test Generation**: Generate questions from text, files (PDF, DOCX), or URLs
- **Class Reports**: Comprehensive analytics and student performance reports
- **Prize System**: Configure and announce rewards for top performers
- **Cheating Detection**: Monitors tab switching, prevents unfair practices

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Create .env.local file with:
# MONGODB_URI=your_mongodb_uri
# GEMINI_API_KEY=your_google_api_key
# JWT_SECRET=your_secret_key
# NEXTAUTH_SECRET=your_secret_key

# Run development server
npm run dev

# Open http://localhost:3000
```

### Deploy to Vercel

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete deployment guide.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── classes/         # Class management
│   │   ├── tests/           # Test CRUD and submission
│   │   ├── results/         # Test results
│   │   ├── leaderboard/     # Rankings
│   │   └── reports/         # Analytics
│   ├── teacher/             # Teacher dashboard and pages
│   ├── student/             # Student pages
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── common/              # Common components (auth, etc)
│   ├── teacher/             # Teacher-specific components
│   └── student/             # Student-specific components
├── lib/
│   ├── db.ts                # Database connection
│   ├── api-client.ts        # API utilities
│   ├── validators.ts        # Input validation
│   └── middleware.ts        # Auth middleware
├── models/                  # MongoDB schemas
├── stores/                  # Zustand state management
└── types/                   # TypeScript types
```

## 🔧 Technology Stack

- **Next.js 14** - Full-stack React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Database
- **TailwindCSS** - Styling
- **JWT + bcryptjs** - Authentication
- **Google Gemini API** - AI features
- **Zustand** - State management

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Classes
- `POST /api/classes/create` - Create class
- `GET /api/classes/list` - List user's classes
- `POST /api/classes/students` - Add student
- `DELETE /api/classes/students` - Remove student

### Tests
- `POST /api/tests/create` - Create test
- `GET /api/tests/list` - List tests in class
- `GET /api/tests/[testId]` - Get test details
- `POST /api/tests/submit` - Submit answers
- `GET /api/tests/available` - Get available tests

### Advanced
- `GET /api/leaderboard` - Get class ranking
- `GET /api/reports/class/[classId]` - Get class report
- `POST /api/tests/generate/text` - Generate from text
- `POST /api/tests/generate/file` - Generate from file
- `POST /api/tests/generate/web` - Generate from URL

## 👥 User Roles

### Teacher
- Create and manage classes
- Build and publish tests
- View leaderboards and reports
- Configure prizes
- Monitor student performance

### Student
- Join classes with code
- Take available tests
- View results and feedback
- See class leaderboard
- Review correct answers

## 🔐 Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Role-based access control
- Input validation on all endpoints
- Cheating detection via tab visibility API
- Secure database connections

## 📊 Database Models

- **User** - Stores teacher/student accounts
- **Class** - Class information and student lists
- **Test** - Test questions and settings
- **TestResult** - Student answers and scores

## 🎯 Environment Variables

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/quiz-app
GEMINI_API_KEY=your_google_api_key
JWT_SECRET=your_secret_key_32_chars_min
NEXTAUTH_SECRET=your_secret_key_32_chars_min
NODE_ENV=development
```

## 📖 Documentation

- **VERCEL_DEPLOYMENT.md** - Complete Vercel deployment guide

## ✅ Testing Checklist

- [ ] User registration works
- [ ] Login/logout works
- [ ] Create class with code
- [ ] Add students to class
- [ ] Create test with questions
- [ ] Publish test
- [ ] Take test as student
- [ ] Auto-grading works
- [ ] View results
- [ ] Check leaderboard
- [ ] Generate test from file
- [ ] Generate test from URL

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed steps.

## 📞 Support

All code is well-documented with:
- Clear variable and function names
- TypeScript type annotations
- Inline comments for complex logic
- Error handling on all endpoints

## 📄 License

Private project

---

**Ready to deploy!** Check [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for Vercel deployment steps.
