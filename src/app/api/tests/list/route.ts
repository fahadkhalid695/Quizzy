import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Test from '@/models/Test';
import Class from '@/models/Class';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const classId = request.nextUrl.searchParams.get('classId');
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const tests = await Test.find({ classId, isPublished: true })
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
    console.error('List tests error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
