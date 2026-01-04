import mongoose, { Schema, Document } from 'mongoose'

export interface IInvitation {
  _id?: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  studentId: string
  studentEmail: string
  studentName: string
  message?: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt: Date
  createdAt?: Date
  updatedAt?: Date
}

interface IInvitationDocument extends Omit<IInvitation, '_id'>, Document {}

const invitationSchema = new Schema<IInvitationDocument>(
  {
    classId: {
      type: String,
      required: true,
    },
    className: {
      type: String,
      required: true,
    },
    teacherId: {
      type: String,
      required: true,
    },
    teacherName: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  { timestamps: true }
)

// Index for faster queries
invitationSchema.index({ studentId: 1, status: 1 })
invitationSchema.index({ teacherId: 1 })
invitationSchema.index({ classId: 1 })

export const Invitation = mongoose.models.Invitation || mongoose.model<IInvitationDocument>('Invitation', invitationSchema)

export default Invitation
