import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Test from '@/models/Test';
import Class from '@/models/Class';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can access this' }, { status: 403 });
    }

    // Get classes student is enrolled in
    const classes = await Class.find({ students: payload.userId }).select('_id');
    const classIds = classes.map((c) => c._id);

    // Get published tests from enrolled classes
    const tests = await Test.find({
      classId: { $in: classIds },
      isPublished: true,
    })
      .populate('classId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      tests: tests.map((test) => ({
        id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        difficulty: test.difficulty,
        totalMarks: test.totalMarks,
        isPublished: test.isPublished,
        classId: test.classId,
        createdAt: test.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get available tests error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
