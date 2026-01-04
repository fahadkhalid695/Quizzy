// User Types
export enum UserRole {
  TEACHER = 'teacher',
  STUDENT = 'student',
  ADMIN = 'admin',
}

export interface IUser {
  _id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  phone?: string
  profileImage?: string
  createdAt: Date
  updatedAt: Date
}

// Class Types
export interface IClass {
  _id: string
  name: string
  description: string
  teacherId: string
  code: string // Unique class code for students to join
  students: string[] // Array of student IDs
  createdAt: Date
  updatedAt: Date
}

// Test Types
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  SHORT_ANSWER = 'short_answer',
  TRUE_FALSE = 'true_false',
  ESSAY = 'essay',
}

export interface IQuestion {
  _id?: string
  type: QuestionType
  question: string
  options?: string[] // For multiple choice
  correctAnswer: string
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  marks: number
}

export interface ITest {
  _id: string
  title: string
  description: string
  teacherId: string
  classId: string
  questions: IQuestion[]
  duration: number // in minutes
  difficulty: 'easy' | 'medium' | 'hard'
  isPublished: boolean
  startTime?: Date
  endTime?: Date
  totalMarks: number
  showAnswers: boolean
  createdAt: Date
  updatedAt: Date
}

// Test Result Types
export interface IStudentAnswer {
  questionId: string
  answer: string
  isCorrect: boolean
  marksObtained: number
  timeSpent: number // in seconds
}

export interface ITestResult {
  _id: string
  testId: string
  studentId: string
  classId: string
  answers: IStudentAnswer[]
  totalMarks: number
  obtainedMarks: number
  percentage: number
  status: 'submitted' | 'grading' | 'graded'
  cheatingScore: number // 0-100, 0 = no cheating detected
  cheatingDetails?: string
  attemptNumber: number
  startedAt: Date
  submittedAt: Date
}

// Test Generation Types
export enum TestSourceType {
  PDF = 'pdf',
  IMAGE = 'image',
  DOCUMENT = 'document',
  POWERPOINT = 'powerpoint',
  WEB_RESEARCH = 'web_research',
}

export interface ITestGenerationRequest {
  sourceType: TestSourceType
  sourceFile?: File
  sourceUrl?: string
  searchQuery?: string
  numberOfQuestions: number
  difficulty: 'easy' | 'medium' | 'hard'
  questionTypes: QuestionType[]
}

// Leaderboard Types
export interface ILeaderboardEntry {
  studentId: string
  studentName: string
  totalTests: number
  averageScore: number
  totalMarksObtained: number
  position: number
}

// Report Types
export interface IClassReport {
  classId: string
  className: string
  totalStudents: number
  totalTests: number
  averageClassScore: number
  topPerformers: ILeaderboardEntry[]
  lowPerformers: ILeaderboardEntry[]
}

export interface IStudentReport {
  studentId: string
  studentName: string
  testsTaken: number
  averageScore: number
  bestScore: number
  worstScore: number
  improvementTrend: number[] // percentage scores over time
  strengths: string[]
  weaknesses: string[]
}
