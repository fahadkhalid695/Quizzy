import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { verifyToken } from '@/lib/auth-middleware'
import Class from '@/models/Class'

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

    // Find class by code (case insensitive)
    const classDoc = await Class.findOne({ code: code.toUpperCase() })
    if (!classDoc) {
      return NextResponse.json({ error: 'Invalid class code. Please check and try again.' }, { status: 404 })
    }

    // Check if student is already in the class
    if (classDoc.students.includes(payload.userId)) {
      return NextResponse.json({ error: 'You are already in this class' }, { status: 400 })
    }

    // Add student to class
    classDoc.students.push(payload.userId)
    await classDoc.save()

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
