import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { verifyToken } from '@/lib/auth-middleware'
import Invitation from '@/models/Invitation'
import Class from '@/models/Class'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

// GET - Get all invitations sent by teacher
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view sent invitations' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    const query: any = { teacherId: payload.userId }
    if (classId) {
      query.classId = classId
    }

    const invitations = await Invitation.find(query)
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error) {
    console.error('Get teacher invitations error:', error)
    return NextResponse.json({ error: 'Failed to get invitations' }, { status: 500 })
  }
}

// POST - Send invitation to a student
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can send invitations' }, { status: 403 })
    }

    const { classId, studentEmail, message } = await request.json()

    if (!classId || classId === 'undefined' || !studentEmail) {
      return NextResponse.json({ error: 'Valid Class ID and student email are required' }, { status: 400 })
    }

    // Get class details
    const classDoc = await Class.findById(classId)
    if (!classDoc) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Verify teacher owns this class
    if (classDoc.teacherId !== payload.userId) {
      return NextResponse.json({ error: 'You can only invite students to your own classes' }, { status: 403 })
    }

    // Find student by email
    const student = await User.findOne({ email: studentEmail.toLowerCase(), role: 'student' })
    if (!student) {
      return NextResponse.json({ error: 'No student found with this email' }, { status: 404 })
    }

    // Check if student is already in the class
    if (classDoc.students.includes(student._id.toString())) {
      return NextResponse.json({ error: 'Student is already in this class' }, { status: 400 })
    }

    // Check for existing pending invitation
    const existingInvitation = await Invitation.findOne({
      classId,
      studentId: student._id.toString(),
      status: 'pending',
    })

    if (existingInvitation) {
      return NextResponse.json({ error: 'An invitation is already pending for this student' }, { status: 400 })
    }

    // Get teacher details
    const teacher = await User.findById(payload.userId)

    // Create invitation
    const invitation = new Invitation({
      classId,
      className: classDoc.name,
      teacherId: payload.userId,
      teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher',
      studentId: student._id.toString(),
      studentEmail: student.email,
      studentName: `${student.firstName} ${student.lastName}`,
      message: message || '',
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    })

    await invitation.save()

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        studentName: invitation.studentName,
        studentEmail: invitation.studentEmail,
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Send invitation error:', error)
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 })
  }
}

// DELETE - Cancel/revoke an invitation
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can cancel invitations' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const invitationId = searchParams.get('id')

    if (!invitationId) {
      return NextResponse.json({ error: 'Invitation ID is required' }, { status: 400 })
    }

    const invitation = await Invitation.findById(invitationId)
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.teacherId !== payload.userId) {
      return NextResponse.json({ error: 'You can only cancel your own invitations' }, { status: 403 })
    }

    await Invitation.findByIdAndDelete(invitationId)

    return NextResponse.json({ success: true, message: 'Invitation cancelled' }, { status: 200 })
  } catch (error) {
    console.error('Cancel invitation error:', error)
    return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 })
  }
}
