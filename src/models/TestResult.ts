import mongoose, { Schema, Document } from 'mongoose'
import { ITestResult } from '@/types'

interface ITestResultDocument extends Omit<ITestResult, '_id'>, Document {}

const answerSchema = new Schema({
  questionId: String,
  answer: String,
  isCorrect: Boolean,
  marksObtained: Number,
  timeSpent: Number,
})

const resultSchema = new Schema<ITestResultDocument>(
  {
    testId: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      required: true,
    },
    classId: {
      type: String,
      required: true,
    },
    answers: [answerSchema],
    totalMarks: {
      type: Number,
      required: true,
    },
    obtainedMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'grading', 'graded'],
      default: 'grading',
    },
    cheatingScore: {
      type: Number,
      default: 0,
    },
    cheatingDetails: String,
    attemptNumber: {
      type: Number,
      default: 1,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

export const TestResult =
  mongoose.models.TestResult || mongoose.model<ITestResultDocument>('TestResult', resultSchema)

export default TestResult
