import mongoose, { Schema, Document } from 'mongoose'
import { IClass } from '@/types'

interface IClassDocument extends IClass, Document {}

const classSchema = new Schema<IClassDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    description: String,
    teacherId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
)

export const Class = mongoose.models.Class || mongoose.model<IClassDocument>('Class', classSchema)
