import mongoose, { Schema, Document } from 'mongoose'
import { ITest, QuestionType } from '@/types'

interface ITestDocument extends Omit<ITest, '_id'>, Document {}

const questionSchema = new Schema({
  type: {
    type: String,
    enum: Object.values(QuestionType),
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [String],
  correctAnswer: {
    type: String,
    required: true,
  },
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
  },
  marks: {
    type: Number,
    required: true,
    default: 1,
  },
})

const testSchema = new Schema<ITestDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    teacherId: {
      type: String,
      required: true,
    },
    classId: {
      type: String,
      required: true,
    },
    questions: [questionSchema],
    duration: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    startTime: Date,
    endTime: Date,
    totalMarks: {
      type: Number,
      required: true,
    },
    showAnswers: {
      type: Boolean,
      default: false,
    },
    // AI Generation metadata
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    sourceType: {
      type: String,
      enum: ['manual', 'topic', 'file', 'text', 'web'],
      default: 'manual',
    },
    sourceTopic: String,
    sourceContent: String,
    // Dynamic Test Settings
    isDynamic: {
      type: Boolean,
      default: false,
    },
    dynamicSettings: {
      questionPool: [questionSchema], // Pool of questions for dynamic generation
      questionsPerStudent: Number,
      shuffleQuestions: {
        type: Boolean,
        default: true,
      },
      shuffleOptions: {
        type: Boolean,
        default: true,
      },
      regenerateOnRetake: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
)

export const Test = mongoose.models.Test || mongoose.model<ITestDocument>('Test', testSchema)

export default Test
