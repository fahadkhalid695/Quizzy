import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { verifyToken } from '@/lib/auth-middleware'
import Class from '@/models/Class'
import User from '@/models/User'

// POST - Join a class using class code
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can join classes' }, { status: 403 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Class code is required' }, { status: 400 })
    }

    // Clean and normalize the code
    const normalizedCode = code.trim().toUpperCase()

    // Find class by code (case insensitive search)
    const classDoc = await Class.findOne({ 
      code: { $regex: new RegExp(`^${normalizedCode}$`, 'i') }
    })
    
    if (!classDoc) {
      return NextResponse.json({ error: 'Invalid class code. Please check and try again.' }, { status: 404 })
    }

    // Check if student is already in the class
    const studentIdStr = payload.userId.toString()
    const isAlreadyEnrolled = classDoc.students.some(
      (id: any) => id.toString() === studentIdStr
    )
    
    if (isAlreadyEnrolled) {
      return NextResponse.json({ error: 'You are already enrolled in this class' }, { status: 400 })
    }

    // Add student to class
    classDoc.students.push(payload.userId)
    await classDoc.save()

    // Also update the student's enrolled classes if the field exists
    await User.findByIdAndUpdate(payload.userId, {
      $addToSet: { enrolledClasses: classDoc._id }
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the class!',
      class: {
        id: classDoc._id,
        name: classDoc.name,
        description: classDoc.description,
        code: classDoc.code,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Join class error:', error)
    return NextResponse.json({ error: 'Failed to join class' }, { status: 500 })
  }
}
