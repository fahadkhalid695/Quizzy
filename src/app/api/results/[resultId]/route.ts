import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';
import Test from '@/models/Test';

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
    const result = await TestResult.findById(resultId).populate('testId').populate('studentId', 'firstName lastName email');

    if (!result) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    // Check access
    if (payload.role === 'student' && result.studentId._id.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      result: {
        id: result._id,
        testId: result.testId._id,
        studentId: result.studentId._id,
        totalMarks: result.totalMarks,
        obtainedMarks: result.obtainedMarks,
        percentage: result.percentage,
        status: result.status,
        answers: result.answers,
        cheatingScore: result.cheatingScore,
        cheatingDetails: result.cheatingDetails,
        submittedAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error('Get result error:', error);
    return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 });
  }
}
