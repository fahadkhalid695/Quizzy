# QuizApp - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create `.env.local` file in the root directory with:

```env
# MongoDB (Get free connection string from MongoDB Atlas)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/quizapp?retryWrites=true&w=majority

# Auth Secret (Generate a random string)
NEXTAUTH_SECRET=your-random-secret-key-here

# App URL
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gemini API (Get from Google AI Studio)
GEMINI_API_KEY=your-gemini-api-key-here

# Environment
NODE_ENV=development
```

### 3. Run Development Server
```bash
npm run dev
```

Visit: **http://localhost:3000**

---

## 📋 Project Overview

### What's Already Built ✅
- ✅ Modern Next.js 14 setup with TypeScript
- ✅ Tailwind CSS styling with custom components
- ✅ MongoDB connection setup
- ✅ User authentication (Register/Login)
- ✅ Database models for users, tests, classes, results
- ✅ Beautiful landing page
- ✅ Teacher and Student dashboards (UI)
- ✅ Reusable UI components

### What Needs Building 🔨
1. Teacher features (create tests, manage classes, analytics)
2. Student features (take tests, view results)
3. Test generation from files (PDF, images, docs)
4. Auto-submission on tab switch
5. Cheating detection system
6. Gemini AI integration for grading
7. Results and leaderboards
8. Result card generation

---

## 👤 Test Accounts

You can register new accounts or use these examples:

**Teacher Account**
- Email: teacher@example.com
- Password: Teacher123

**Student Account**
- Email: student@example.com
- Password: Student123

---

## 📁 Key Files to Know

### Models
- `src/models/User.ts` - User schema
- `src/models/Test.ts` - Test questions schema
- `src/models/Class.ts` - Class schema
- `src/models/TestResult.ts` - Student results schema

### API Routes
- `src/app/api/auth/register` - Registration
- `src/app/api/auth/login` - Login

### Pages
- `src/app/page.tsx` - Landing page
- `src/app/auth/register/page.tsx` - Register page
- `src/app/auth/login/page.tsx` - Login page
- `src/app/teacher/dashboard/page.tsx` - Teacher dashboard
- `src/app/student/dashboard/page.tsx` - Student dashboard

### Components
- `src/components/ui/Button.tsx` - Button component
- `src/components/ui/Card.tsx` - Card component
- `src/components/ui/FormElements.tsx` - Form inputs

### Configuration
- `tailwind.config.ts` - Tailwind customization
- `tsconfig.json` - TypeScript config
- `package.json` - Dependencies
- `.env.local.example` - Environment template

---

## 🎨 Design System

### Colors
- **Primary**: Indigo/Purple gradient
- **Secondary**: Green (success)
- **Danger**: Red
- **Warning**: Amber

### Components Available
- Button (4 variants: primary, secondary, danger, success)
- Card (with header, body, footer)
- Input, TextArea, Select
- Form layouts

---

## 🔧 Development Workflow

### Running Tests
```bash
npm run type-check
```

### Building for Production
```bash
npm run build
npm run start
```

---

## 📚 Important Documentation

- **`README.md`** - Full project overview
- **`DEVELOPMENT.md`** - Detailed development guide
- **`src/types/index.ts`** - All TypeScript types
- **`.env.local.example`** - Environment variables template

---

## ❓ Troubleshooting

### Database Connection Issues
- Verify MongoDB URI in `.env.local`
- Check IP whitelist in MongoDB Atlas
- Ensure connection string has correct username/password

### Authentication Errors
- Clear browser localStorage
- Check NEXTAUTH_SECRET is set
- Verify JWT secret matches

### Gemini API Issues
- Verify API key is correct
- Check API is enabled in Google Cloud Console
- Review API quotas and limits

---

## 🎯 Next Steps

1. **Set up your environment variables** (.env.local)
2. **Create a MongoDB Atlas free account** (if you haven't)
3. **Get a Gemini API key** from Google AI Studio
4. **Run `npm install && npm run dev`**
5. **Test registration and login**
6. **Start building features from DEVELOPMENT.md**

---

## 📞 Support

For detailed feature implementation, see `DEVELOPMENT.md` which includes:
- Step-by-step guide for each feature
- API routes needed
- Component structure
- Database operations

---

Happy coding! 🚀
