import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Class from '@/models/Class';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let classes;
    if (payload.role === 'teacher') {
      // Get classes taught by this teacher
      classes = await Class.find({ teacherId: payload.userId })
        .populate('students', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else if (payload.role === 'student') {
      // Get classes student is enrolled in
      classes = await Class.find({ students: payload.userId })
        .populate('teacherId', 'firstName lastName email')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      classes: classes || [],
    });
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
