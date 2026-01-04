# Quiz System App

A comprehensive, AI-powered Quiz Management System for teachers and students.

## Features

✨ **Core Features**
- 👨‍🏫 Teacher Dashboard with complete class management
- 👨‍🎓 Student Portal with test interface
- 🔄 Dynamic tests based on teacher preferences
- 🤖 AI-powered test generation from PDFs, images, documents, and web research (Gemini API)
- ⚡ Auto-submission on tab switching
- 🎯 Intelligent cheating detection system
- 📊 Auto-grading with detailed reports
- 🏆 Leaderboard and prizes announcer
- 📝 Result cards and performance analytics
- 💾 Complete test history and progress tracking
- 🔐 Secure authentication system
- 📱 Responsive and modern UI

## Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Database**: MongoDB
- **Styling**: TailwindCSS
- **Authentication**: NextAuth.js
- **AI Integration**: Google Gemini API
- **File Processing**: PDF-Parse, Multer
- **State Management**: Zustand

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── teacher/           # Teacher dashboard & features
│   ├── student/           # Student portal & tests
│   ├── admin/             # Admin panel
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # UI components (buttons, cards, etc.)
│   ├── teacher/          # Teacher-specific components
│   ├── student/          # Student-specific components
│   └── common/           # Shared components
├── lib/                   # Utilities and helpers
│   ├── db.ts            # Database connection
│   ├── auth.ts          # Authentication logic
│   ├── gemini.ts        # Gemini API integration
│   ├── fileProcessor.ts # File processing utilities
│   └── validators.ts    # Input validation
├── models/               # MongoDB schemas
│   ├── User.ts
│   ├── Test.ts
│   ├── Result.ts
│   └── Class.ts
├── types/                # TypeScript type definitions
└── styles/               # Global styles
```

## Environment Variables

Create a `.env.local` file:

```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Key Components & Features

### Authentication System
- Secure registration for teachers and students
- Email verification
- Password reset functionality
- NextAuth.js integration

### Teacher Features
- Create and manage classes
- Design tests with various question types
- Generate tests from multiple sources
- Adjust difficulty levels
- Monitor student progress
- View detailed analytics and reports
- Generate result cards
- Announce prizes and rankings

### Student Features
- Join classes using teacher-provided codes
- Take tests with time management
- Auto-submission on tab switch
- View results and feedback
- Track performance history
- Access leaderboards

### AI Integration
- Generate questions from PDFs, images, documents
- Web research for content generation
- Intelligent auto-grading
- Cheating detection analysis
- Question validation

## Building for Production

```bash
npm run build
npm run start
```

## License

MIT License

---

For more information, visit the project documentation or contact the development team.
