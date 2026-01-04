import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';

export const dynamic = 'force-dynamic';

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

    // Get all results for this student
    const results = await TestResult.find({ studentId: payload.userId })
      .populate('testId', 'title totalMarks duration difficulty')
      .sort({ submittedAt: -1 })
      .lean();

    const formattedResults = results.map((result: any) => ({
      id: result._id.toString(),
      testId: result.testId ? {
        title: result.testId.title,
        totalMarks: result.testId.totalMarks,
      } : null,
      score: result.score,
      percentage: result.percentage,
      submittedAt: result.submittedAt,
      timeTaken: result.timeTaken || 0,
    }));

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
