import mongoose, { Schema, Document } from 'mongoose'
import { ITest, QuestionType } from '@/types'

interface ITestDocument extends ITest, Document {}

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
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    classId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Class',
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
  },
  { timestamps: true }
)

export const Test = mongoose.models.Test || mongoose.model<ITestDocument>('Test', testSchema)

export default Test
