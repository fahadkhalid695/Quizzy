import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Class from '@/models/Class';

export const dynamic = 'force-dynamic';

// GET - Get classes student is enrolled in
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can access this' }, { status: 403 });
    }

    console.log('Fetching enrolled classes for student:', payload.userId);

    // Find all classes where student is enrolled
    const classes = await Class.find({
      $or: [
        { students: payload.userId },
        { students: payload.userId.toString() }
      ]
    }).select('_id name description code teacherId createdAt');

    console.log('Found enrolled classes:', classes.length);

    return NextResponse.json({
      success: true,
      classes: classes.map((c) => ({
        id: c._id,
        name: c.name,
        description: c.description,
        code: c.code,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get enrolled classes error:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
