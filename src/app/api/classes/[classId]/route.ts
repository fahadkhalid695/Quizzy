import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Class from '@/models/Class';

export async function GET(request: NextRequest, props: { params: Promise<{ classId: string }> }) {
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

    const { classId } = await props.params;
    const classDoc = await Class.findById(classId)
      .populate('teacherId', 'firstName lastName email')
      .populate('students', 'firstName lastName email');

    if (!classDoc) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      class: {
        id: classDoc._id,
        name: classDoc.name,
        description: classDoc.description,
        code: classDoc.code,
        teacherId: classDoc.teacherId,
        students: classDoc.students,
        createdAt: classDoc.createdAt,
      },
    });
  } catch (error) {
    console.error('Get class error:', error);
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 });
  }
}
