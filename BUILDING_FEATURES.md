# How to Build Each Feature - Step by Step Guide

## 1. Building Class Management Feature

### Step 1: Create Database API Route
**File**: `src/app/api/teacher/classes/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Class } from '@/models/Class'
import { protectedRoute } from '@/lib/auth-middleware'
import { generateClassCode } from '@/lib/validators'

export async function POST(request: NextRequest) {
  const auth = await protectedRoute(request, 'teacher')
  if (auth instanceof NextResponse) return auth

  await connectDB()
  
  const { name, description } = await request.json()
  
  const newClass = new Class({
    name,
    description,
    teacherId: auth.userId,
    code: generateClassCode(),
  })
  
  await newClass.save()
  return NextResponse.json(newClass, { status: 201 })
}

export async function GET(request: NextRequest) {
  const auth = await protectedRoute(request, 'teacher')
  if (auth instanceof NextResponse) return auth

  await connectDB()
  
  const classes = await Class.find({ teacherId: auth.userId })
  return NextResponse.json(classes)
}
```

### Step 2: Create Frontend Component
**File**: `src/components/teacher/ClassForm.tsx`

```typescript
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, TextArea } from '@/components/ui/FormElements'
import { useNotify } from '@/components/common/Notification'
import { api } from '@/lib/api-client'

export function ClassForm() {
  const [loading, setLoading] = useState(false)
  const notify = useNotify()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/teacher/classes', formData)
      notify.success('Class created successfully!')
      setFormData({ name: '', description: '' })
    } catch (error) {
      notify.error('Failed to create class')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Class Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />
      <TextArea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <Button type="submit" variant="primary" isLoading={loading}>
        Create Class
      </Button>
    </form>
  )
}
```

### Step 3: Create Page
**File**: `src/app/teacher/classes/page.tsx`

```typescript
'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { ClassForm } from '@/components/teacher/ClassForm'
import { api } from '@/lib/api-client'
import { IClass } from '@/types'

export default function ClassesPage() {
  const [classes, setClasses] = useState<IClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    try {
      const data = await api.get<IClass[]>('/teacher/classes')
      setClasses(data)
    } catch (error) {
      console.error('Failed to fetch classes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader title="Create New Class" />
        <CardBody>
          <ClassForm />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Your Classes" />
        <CardBody>
          {loading ? (
            <p>Loading...</p>
          ) : classes.length === 0 ? (
            <p className="text-gray-600">No classes yet</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div key={cls._id} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-lg">{cls.name}</h3>
                  <p className="text-gray-600 text-sm">{cls.description}</p>
                  <p className="text-sm mt-2">
                    <strong>Code:</strong> {cls.code}
                  </p>
                  <p className="text-sm">
                    <strong>Students:</strong> {cls.students.length}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
```

---

## 2. Building Test Creation Feature

### Step 1: Create Database API Route
**File**: `src/app/api/teacher/tests/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Test } from '@/models/Test'
import { protectedRoute } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const auth = await protectedRoute(request, 'teacher')
  if (auth instanceof NextResponse) return auth

  await connectDB()
  
  const { title, description, classId, duration, difficulty, questions } = 
    await request.json()
  
  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0)
  
  const newTest = new Test({
    title,
    description,
    classId,
    teacherId: auth.userId,
    duration,
    difficulty,
    questions,
    totalMarks,
  })
  
  await newTest.save()
  return NextResponse.json(newTest, { status: 201 })
}

export async function GET(request: NextRequest) {
  const auth = await protectedRoute(request, 'teacher')
  if (auth instanceof NextResponse) return auth

  await connectDB()
  
  const tests = await Test.find({ teacherId: auth.userId })
  return NextResponse.json(tests)
}
```

### Step 2: Create Test Builder Component
**File**: `src/components/teacher/TestBuilder.tsx`

```typescript
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, TextArea, Select } from '@/components/ui/FormElements'
import { IQuestion, QuestionType } from '@/types'

interface TestBuilderProps {
  onSubmit: (data: any) => Promise<void>
  loading?: boolean
}

export function TestBuilder({ onSubmit, loading = false }: TestBuilderProps) {
  const [testData, setTestData] = useState({
    title: '',
    description: '',
    duration: 60,
    difficulty: 'medium',
    questions: [] as IQuestion[],
  })

  const [currentQuestion, setCurrentQuestion] = useState<Partial<IQuestion>>({
    type: QuestionType.MULTIPLE_CHOICE,
    marks: 1,
    difficulty: 'medium',
  })

  const addQuestion = () => {
    if (currentQuestion.question && currentQuestion.correctAnswer) {
      setTestData((prev) => ({
        ...prev,
        questions: [...prev.questions, currentQuestion as IQuestion],
      }))
      setCurrentQuestion({
        type: QuestionType.MULTIPLE_CHOICE,
        marks: 1,
        difficulty: 'medium',
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(testData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Input
          label="Test Title"
          value={testData.title}
          onChange={(e) => setTestData({ ...testData, title: e.target.value })}
          required
        />
        <Input
          label="Duration (minutes)"
          type="number"
          value={testData.duration}
          onChange={(e) =>
            setTestData({ ...testData, duration: parseInt(e.target.value) })
          }
          required
        />
      </div>

      <TextArea
        label="Description"
        value={testData.description}
        onChange={(e) => setTestData({ ...testData, description: e.target.value })}
      />

      <Select
        label="Difficulty"
        value={testData.difficulty}
        onChange={(e) => setTestData({ ...testData, difficulty: e.target.value as any })}
        options={[
          { value: 'easy', label: 'Easy' },
          { value: 'medium', label: 'Medium' },
          { value: 'hard', label: 'Hard' },
        ]}
      />

      {/* Question Builder */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-semibold mb-4">Add Question</h3>
        
        <Select
          label="Question Type"
          value={currentQuestion.type || QuestionType.MULTIPLE_CHOICE}
          onChange={(e) =>
            setCurrentQuestion({ ...currentQuestion, type: e.target.value as QuestionType })
          }
          options={[
            { value: QuestionType.MULTIPLE_CHOICE, label: 'Multiple Choice' },
            { value: QuestionType.SHORT_ANSWER, label: 'Short Answer' },
            { value: QuestionType.TRUE_FALSE, label: 'True/False' },
            { value: QuestionType.ESSAY, label: 'Essay' },
          ]}
        />

        <TextArea
          label="Question"
          value={currentQuestion.question || ''}
          onChange={(e) =>
            setCurrentQuestion({ ...currentQuestion, question: e.target.value })
          }
          className="mt-4"
        />

        {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && (
          <TextArea
            label="Options (one per line)"
            value={(currentQuestion.options || []).join('\n')}
            onChange={(e) =>
              setCurrentQuestion({
                ...currentQuestion,
                options: e.target.value.split('\n'),
              })
            }
            className="mt-4"
          />
        )}

        <Input
          label="Correct Answer"
          value={currentQuestion.correctAnswer || ''}
          onChange={(e) =>
            setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })
          }
          className="mt-4"
        />

        <Input
          label="Marks"
          type="number"
          value={currentQuestion.marks || 1}
          onChange={(e) =>
            setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })
          }
          className="mt-4"
        />

        <Button type="button" onClick={addQuestion} variant="secondary" className="mt-4">
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      {testData.questions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Questions ({testData.questions.length})</h3>
          <div className="space-y-2">
            {testData.questions.map((q, idx) => (
              <div key={idx} className="border rounded p-3 bg-gray-50">
                <p className="font-medium">{idx + 1}. {q.question}</p>
                <p className="text-sm text-gray-600">Marks: {q.marks}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" variant="primary" isLoading={loading} className="w-full">
        Create Test
      </Button>
    </form>
  )
}
```

---

## 3. Building Test Taking Feature

### File: `src/app/student/test/[id]/page.tsx`

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api-client'
import { useTestStore } from '@/lib/store'
import { ITest, IQuestion } from '@/types'

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const [test, setTest] = useState<ITest | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  
  const { startTest, updateAnswer, goToQuestion } = useTestStore()

  useEffect(() => {
    fetchTest()
    // Detect tab switch
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (test) {
      setTimeLeft(test.duration * 60)
      startTest(test._id)
    }
  }, [test])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          submitTest()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [test])

  const fetchTest = async () => {
    try {
      const data = await api.get<ITest>(`/student/tests/${params.id}`)
      setTest(data)
    } catch (error) {
      console.error('Failed to load test')
    } finally {
      setLoading(false)
    }
  }

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // User left the tab - auto submit
      submitTest()
    }
  }

  const submitTest = async () => {
    // Get answers from store and submit
    router.push('/student/results')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) return <div>Loading test...</div>
  if (!test) return <div>Test not found</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg">
        <h1 className="text-2xl font-bold">{test.title}</h1>
        <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600' : 'text-green-600'}`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Test Interface - Add question rendering, answer handling, etc. */}
      
      <div className="flex gap-4 mt-8">
        <Button variant="secondary" onClick={() => router.back()}>
          Review
        </Button>
        <Button variant="danger" onClick={submitTest}>
          Submit Test
        </Button>
      </div>
    </div>
  )
}
```

---

## 4. Building Auto-Grading Feature

### File: `src/app/api/tests/grade/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Test } from '@/models/Test'
import { TestResult } from '@/models/TestResult'
import { gradeShortAnswer, detectCheating } from '@/lib/gemini'
import { protectedRoute } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const auth = await protectedRoute(request)
  if (auth instanceof NextResponse) return auth

  await connectDB()

  const { testId, answers, submittedAt, startedAt } = await request.json()

  const test = await Test.findById(testId)
  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 })
  }

  let obtainedMarks = 0
  const gradedAnswers = []

  // Grade each answer
  for (const answer of answers) {
    const question = test.questions.find((q) => q._id.toString() === answer.questionId)
    if (!question) continue

    let isCorrect = false
    let marksObtained = 0

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      isCorrect = answer.answer.toLowerCase() === question.correctAnswer.toLowerCase()
      marksObtained = isCorrect ? question.marks : 0
    } else {
      // Use Gemini for grading
      const gradeResult = await gradeShortAnswer(
        question.question,
        answer.answer,
        question.correctAnswer
      )
      isCorrect = gradeResult.isCorrect
      marksObtained = (gradeResult.score / 100) * question.marks
    }

    obtainedMarks += marksObtained

    gradedAnswers.push({
      questionId: answer.questionId,
      answer: answer.answer,
      isCorrect,
      marksObtained,
      timeSpent: answer.timeSpent,
    })
  }

  // Detect cheating
  const timeSpent = Math.floor((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000)
  const cheatingResult = await detectCheating(
    answers.map((a) => ({
      question: test.questions.find((q) => q._id.toString() === a.questionId)?.question || '',
      answer: a.answer,
    })),
    test.duration,
    timeSpent
  )

  // Save result
  const result = new TestResult({
    testId,
    studentId: auth.userId,
    classId: test.classId,
    answers: gradedAnswers,
    totalMarks: test.totalMarks,
    obtainedMarks,
    percentage: (obtainedMarks / test.totalMarks) * 100,
    status: 'graded',
    cheatingScore: cheatingResult.cheatingScore,
    cheatingDetails: cheatingResult.details,
    startedAt,
    submittedAt,
  })

  await result.save()

  return NextResponse.json(result, { status: 201 })
}
```

---

## 5. Building Leaderboard Feature

### File: `src/app/student/leaderboard/page.tsx`

```typescript
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { api } from '@/lib/api-client'
import { ILeaderboardEntry } from '@/types'

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<ILeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const data = await api.get<ILeaderboardEntry[]>('/student/leaderboard')
      setLeaderboard(data)
    } catch (error) {
      console.error('Failed to fetch leaderboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Class Leaderboard" />
      <CardBody>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Position</th>
                  <th className="px-4 py-2 text-left">Student Name</th>
                  <th className="px-4 py-2 text-right">Avg Score</th>
                  <th className="px-4 py-2 text-right">Total Marks</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.studentId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-lg">
                      {entry.position === 1 && '🥇'}
                      {entry.position === 2 && '🥈'}
                      {entry.position === 3 && '🥉'}
                      {entry.position > 3 && entry.position}
                    </td>
                    <td className="px-4 py-3">{entry.studentName}</td>
                    <td className="px-4 py-3 text-right">{entry.averageScore.toFixed(2)}%</td>
                    <td className="px-4 py-3 text-right">{entry.totalMarksObtained}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
```

---

## General Tips for Building Features

1. **Always verify authentication** - Use `protectedRoute` middleware
2. **Connect to database** - Use `connectDB()` before queries
3. **Handle errors gracefully** - Try-catch and proper error messages
4. **Use Zustand for state** - Already set up for auth, tests, notifications
5. **Validate input** - Check required fields and formats
6. **Use notifications** - Use `useNotify()` for user feedback
7. **Keep components modular** - Small, reusable components
8. **Optimize queries** - Select only needed fields
9. **Add proper typing** - Use TypeScript interfaces
10. **Test thoroughly** - Manual testing before deployment

---

**Happy Building! 🚀**

For more details, refer to DEVELOPMENT.md and API.md
