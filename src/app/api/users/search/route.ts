import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { verifyToken } from '@/lib/auth-middleware'
import User from '@/models/User'

// GET - Search for users by email
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
    const email = searchParams.get('email')
    const role = searchParams.get('role') // 'student', 'teacher', or null for all

    if (!email || email.length < 3) {
      return NextResponse.json({ error: 'Please enter at least 3 characters to search' }, { status: 400 })
    }

    const query: any = {
      email: { $regex: email, $options: 'i' },
      _id: { $ne: payload.userId }, // Exclude current user
    }

    if (role) {
      query.role = role
    }

    const users: any[] = await User.find(query)
      .select('_id firstName lastName email role')
      .limit(10)
      .lean()

    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
      })),
    }, { status: 200 })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 })
  }
}
