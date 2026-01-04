# ⚡ Quick Start - Get Running in 2 Minutes

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Create Environment File
Create `.env.local` in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/quizapp
NEXTAUTH_SECRET=your-secret-key-change-this
GEMINI_API_KEY=paste-your-gemini-api-key-here
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

**Get Gemini API Key**: https://ai.google.dev

## Step 3: Start MongoDB (Optional - Use Atlas Instead)
```bash
# If using local MongoDB
mongod

# OR use MongoDB Atlas (cloud)
# Just update MONGODB_URI in .env.local with your connection string
```

## Step 4: Run Development Server
```bash
npm run dev
```

## Step 5: Open in Browser
```
http://localhost:3000
```

---

## 🎯 Test User Accounts

### Create Your Accounts (via Registration):

**As Teacher:**
1. Go to http://localhost:3000/auth/register
2. Select "Teacher" role
3. Fill in details:
   - First Name: John
   - Last Name: Teacher
   - Email: teacher@example.com
   - Password: Test@1234
4. Click Register → Redirects to Login
5. Login with credentials

**As Student:**
1. Go to http://localhost:3000/auth/register
2. Select "Student" role
3. Fill in details:
   - First Name: Jane
   - Last Name: Student
   - Email: student@example.com
   - Password: Test@1234
4. Register & Login

---

## 📖 Navigate the App

### **As Teacher** (After Login)
1. Dashboard: `/teacher/dashboard`
   - See classes, tests, students count
   - Quick action buttons
   
2. Create Class: `/teacher/classes`
   - Click "+ New Class"
   - Add class name & description
   - Copy class code
   
3. Manage Class: `/teacher/classes/[classId]`
   - Add students by email
   - Create tests with questions
   - View leaderboard
   - View class report
   - Configure prizes
   
4. Create Test: Use the "Test Form" component
   - Add multiple questions (MCQ, Short Answer, etc.)
   - Set difficulty, marks, duration
   - Publish test

### **As Student** (After Login)
1. Dashboard: `/student/dashboard`
   - See your stats
   
2. Available Tests: `/student/tests`
   - Find tests from classes you're in
   
3. Take Test: `/student/test/[testId]`
   - Answer all questions
   - Timer counts down
   - Can navigate between questions
   
4. View Results: After submission
   - See score, percentage
   - Review answers
   - See correct answers

---

## 🚀 Testing Workflow

### **Full Flow Test**:

1. **Login as Teacher**
   ```
   Email: teacher@example.com
   Password: Test@1234
   ```

2. **Create a Class**
   - Go to Classes
   - Click "+ New Class"
   - Enter name: "Biology 101"
   - Save

3. **Add Students**
   - Go to your class
   - Click "Add Student"
   - Enter: student@example.com
   - Click "Add Student"

4. **Create Test**
   - In class, click "+ Create Test"
   - Add 3 questions:
     - MCQ: "What is photosynthesis?" (Options: A-D)
     - Short Answer: "What are mitochondria?"
     - True/False: "Plants produce oxygen"
   - Set duration: 5 minutes (for testing)
   - Click "Create Test"
   - Publish test

5. **Logout and Login as Student**
   ```
   Email: student@example.com
   Password: Test@1234
   ```

6. **Take the Test**
   - Go to "Available Tests"
   - Click "Start Test"
   - Answer all questions
   - Submit test

7. **View Results**
   - See score and feedback
   - Review answers

8. **Login as Teacher**
   - View leaderboard
   - View class report
   - See prizes/winners

---

## 🔧 Useful Commands

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Check for TypeScript errors
npx tsc --noEmit
```

---

## 🌐 Using MongoDB Atlas (Cloud)

Instead of local MongoDB:

1. Create free account: https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Add to `.env.local`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/quizapp?retryWrites=true&w=majority
```

---

## ✨ Features to Explore

### **Amazing Features You Now Have**:

1. **Auto-Grading** - Takes test, grades it instantly
2. **Cheating Detection** - Warns on tab switch, auto-submits after 3x
3. **AI Test Generation** - Generate questions from text/files/URLs
4. **Leaderboards** - Real-time rankings
5. **Class Reports** - Downloadable reports
6. **Prize System** - Customize rewards for winners
7. **Full UI** - Beautiful, responsive design

---

## 📱 Responsive Design

The app works on:
- ✅ Desktop (1920px+)
- ✅ Laptop (1366px)
- ✅ Tablet (768px)
- ✅ Mobile (375px)

Test on your phone by:
```
http://[your-ip]:3000
```

---

## 🐛 Debugging

### **See API Calls in Console**
Open browser DevTools (F12) → Network tab → Check API requests/responses

### **Check Backend Errors**
Look at terminal running `npm run dev` for error messages

### **Database Issues**
Check MongoDB is running:
```bash
# If using local MongoDB
mongosh

# Should show: test>
```

---

## 📚 File Descriptions

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page |
| `src/app/auth/register/page.tsx` | Registration |
| `src/app/auth/login/page.tsx` | Login |
| `src/app/teacher/**` | Teacher pages |
| `src/app/student/**` | Student pages |
| `src/app/api/**` | Backend API routes |
| `src/components/**` | React components |
| `src/lib/**` | Utilities & helpers |
| `src/models/**` | MongoDB schemas |

---

## 🎓 Learning Path

1. **Start**: Register and login
2. **Explore**: Create a class
3. **Build**: Add students and create test
4. **Test**: Take test as student
5. **Analyze**: View results & leaderboard
6. **Enhance**: Use AI to generate questions

---

## 💡 Tips

- Use `student@example.com` for multiple students (change number)
- Set test duration to 5 minutes for quick testing
- Test cheating detection by switching tabs
- Try AI test generation with your own text/files
- Check browser console for helpful error messages

---

## ✅ Everything Ready!

Your app is **fully functional** with:
- ✅ Authentication
- ✅ Class management
- ✅ Test creation
- ✅ Test taking
- ✅ Auto-grading
- ✅ Results & feedback
- ✅ Leaderboards
- ✅ Reports
- ✅ AI features

**Have fun!** 🎉

---

## 🆘 Need Help?

Check these files:
- `IMPLEMENTATION_COMPLETE.md` - Full feature list
- `DEVELOPMENT.md` - Detailed guides
- `API.md` - API documentation
- `ARCHITECTURE.md` - System design

Each component has comments explaining the code!
