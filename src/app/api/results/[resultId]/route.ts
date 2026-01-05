import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';
import Test from '@/models/Test';
import User from '@/models/User';

export async function GET(request: NextRequest, props: { params: Promise<{ resultId: string }> }) {
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

    const { resultId } = await props.params;

    if (!resultId || resultId === 'undefined') {
      return NextResponse.json({ error: 'Valid Result ID is required' }, { status: 400 });
    }

    const result = await TestResult.findById(resultId);

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Manually fetch test and student since IDs are stored as strings
    const [test, student] = await Promise.all([
      Test.findById(result.testId),
      User.findById(result.studentId).select('firstName lastName email')
    ]);

    // Check access
    if (payload.role === 'student' && result.studentId?.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      result: {
        id: result._id,
        testId: result.testId,
        testTitle: test?.title || 'Test',
        studentId: result.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        totalMarks: result.totalMarks,
        obtainedMarks: result.obtainedMarks,
        percentage: result.percentage,
        status: result.status,
        answers: result.answers,
        cheatingScore: result.cheatingScore,
        cheatingDetails: result.cheatingDetails,
        submittedAt: result.createdAt,
        test: test ? {
          title: test.title,
          questions: test.questions,
          showAnswers: test.showAnswers,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get result error:', error);
    return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 });
  }
}
