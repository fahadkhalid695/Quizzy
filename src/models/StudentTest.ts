import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentTest extends Document {
  testId: string;
  studentId: string;
  assignedQuestions: {
    question: string;
    type: string;
    options?: string[];
    correctAnswer: string;
    marks: number;
    difficulty?: string;
  }[];
  status: 'assigned' | 'in_progress' | 'completed' | 'abandoned';
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const assignedQuestionSchema = new Schema({
  question: { type: String, required: true },
  type: { type: String, required: true },
  options: [String],
  correctAnswer: { type: String, required: true },
  marks: { type: Number, default: 1 },
  difficulty: String,
});

const studentTestSchema = new Schema<IStudentTest>(
  {
    testId: {
      type: String,
      required: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    assignedQuestions: [assignedQuestionSchema],
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'abandoned'],
      default: 'assigned',
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound index for finding student's test attempts
studentTestSchema.index({ testId: 1, studentId: 1 });

const StudentTest = mongoose.models.StudentTest || mongoose.model<IStudentTest>('StudentTest', studentTestSchema);

export default StudentTest;
