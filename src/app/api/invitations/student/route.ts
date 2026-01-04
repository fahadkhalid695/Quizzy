import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { verifyToken } from '@/lib/auth-middleware'
import Invitation from '@/models/Invitation'
import Class from '@/models/Class'

// GET - Get all invitations for a student
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'accepted', 'declined', 'all'

    const query: any = { studentId: payload.userId }
    
    if (status && status !== 'all') {
      query.status = status
    }

    // Also check for expired invitations and update them
    await Invitation.updateMany(
      { 
        studentId: payload.userId, 
        status: 'pending', 
        expiresAt: { $lt: new Date() } 
      },
      { $set: { status: 'expired' } }
    )

    const invitations = await Invitation.find(query)
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error) {
    console.error('Get student invitations error:', error)
    return NextResponse.json({ error: 'Failed to get invitations' }, { status: 500 })
  }
}

// POST - Accept or decline an invitation
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

    const { invitationId, action } = await request.json()

    if (!invitationId || !action) {
      return NextResponse.json({ error: 'Invitation ID and action are required' }, { status: 400 })
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "accept" or "decline"' }, { status: 400 })
    }

    const invitation = await Invitation.findById(invitationId)
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    if (invitation.studentId !== payload.userId) {
      return NextResponse.json({ error: 'This invitation is not for you' }, { status: 403 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation has already been ${invitation.status}` }, { status: 400 })
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'expired'
      await invitation.save()
      return NextResponse.json({ error: 'This invitation has expired' }, { status: 400 })
    }

    if (action === 'accept') {
      // Add student to class
      const classDoc = await Class.findById(invitation.classId)
      if (!classDoc) {
        return NextResponse.json({ error: 'Class no longer exists' }, { status: 404 })
      }

      // Check if already in class
      if (!classDoc.students.includes(payload.userId)) {
        classDoc.students.push(payload.userId)
        await classDoc.save()
      }

      invitation.status = 'accepted'
      await invitation.save()

      return NextResponse.json({
        success: true,
        message: 'You have joined the class!',
        class: {
          id: classDoc._id,
          name: classDoc.name,
          code: classDoc.code,
        },
      }, { status: 200 })
    } else {
      invitation.status = 'declined'
      await invitation.save()

      return NextResponse.json({
        success: true,
        message: 'Invitation declined',
      }, { status: 200 })
    }
  } catch (error) {
    console.error('Respond to invitation error:', error)
    return NextResponse.json({ error: 'Failed to respond to invitation' }, { status: 500 })
  }
}
