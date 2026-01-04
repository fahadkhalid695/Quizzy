import mongoose, { Schema, Document } from 'mongoose'
import { IUser, UserRole } from '@/types'

interface IUserDocument extends Omit<IUser, '_id'>, Document {
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    phone: String,
    profileImage: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
)

export const User = mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema)

export default User
