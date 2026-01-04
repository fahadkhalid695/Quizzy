import mongoose, { Schema, Document } from 'mongoose'
import { IClass } from '@/types'

interface IClassDocument extends Omit<IClass, '_id'>, Document {}

const classSchema = new Schema<IClassDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    teacherId: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    students: [String],
  },
  { timestamps: true }
)

export const Class = mongoose.models.Class || mongoose.model<IClassDocument>('Class', classSchema)

export default Class
