import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Test from '@/models/Test';

export async function GET(request: NextRequest, props: { params: Promise<{ testId: string }> }) {
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

    const { testId } = await props.params;
    const test = await Test.findById(testId).populate('classId', 'name');

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check access: teacher owns it or student is in the class
    if (payload.role === 'teacher' && test.teacherId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      test: {
        id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        difficulty: test.difficulty,
        questions: test.questions,
        isPublished: test.isPublished,
        startTime: test.startTime,
        endTime: test.endTime,
        classId: test.classId,
      },
    });
  } catch (error) {
    console.error('Get test error:', error);
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ testId: string }> }) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can update tests' }, { status: 403 });
    }

    const { testId } = await props.params;
    const test = await Test.findById(testId);

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.teacherId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { title, description, difficulty, startTime, endTime, isPublished } = await request.json();

    if (title) test.title = title;
    if (description !== undefined) test.description = description;
    if (difficulty) test.difficulty = difficulty;
    if (startTime) test.startTime = new Date(startTime);
    if (endTime) test.endTime = new Date(endTime);
    if (isPublished !== undefined) test.isPublished = isPublished;

    await test.save();

    return NextResponse.json({
      success: true,
      message: 'Test updated successfully',
    });
  } catch (error) {
    console.error('Update test error:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}
