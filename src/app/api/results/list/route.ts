import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';
import Test from '@/models/Test';

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
      .sort({ submittedAt: -1 })
      .lean();

    // Get all test IDs from results
    const testIds = [...new Set(results.map((r: any) => r.testId))];
    
    // Fetch test details
    const tests: any[] = await Test.find({ 
      $or: [
        { _id: { $in: testIds } },
        { _id: { $in: testIds.map((id: any) => id?.toString()).filter(Boolean) } }
      ]
    }).select('title totalMarks duration difficulty').lean();
    
    const testMap = new Map(tests.map((t: any) => [t._id.toString(), t]));

    const formattedResults = results.map((result: any) => {
      const test = testMap.get(result.testId?.toString());
      return {
        id: result._id.toString(),
        testId: test ? {
          title: test.title,
          totalMarks: test.totalMarks,
        } : { title: 'Unknown Test', totalMarks: 0 },
        score: result.score,
        percentage: result.percentage,
        submittedAt: result.submittedAt,
        timeTaken: result.timeTaken || 0,
      };
    });

    return NextResponse.json({ results: formattedResults });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
