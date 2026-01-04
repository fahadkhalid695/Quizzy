import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';
import User from '@/models/User';

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

    const classId = request.nextUrl.searchParams.get('classId');

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Get all results for the class
    const results = await TestResult.find({ classId })
      .populate('studentId', 'firstName lastName email')
      .populate('testId', 'title duration')
      .sort({ percentage: -1, createdAt: -1 });

    // Group by student and calculate average
    const studentStats = new Map<string, any>();

    results.forEach((result: any) => {
      const studentId = result.studentId._id.toString();
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          studentId,
          firstName: result.studentId.firstName,
          lastName: result.studentId.lastName,
          email: result.studentId.email,
          totalTests: 0,
          totalMarks: 0,
          obtainedMarks: 0,
          averagePercentage: 0,
          testResults: [],
        });
      }

      const stats = studentStats.get(studentId);
      stats.totalTests += 1;
      stats.totalMarks += result.totalMarks;
      stats.obtainedMarks += result.obtainedMarks;
      stats.testResults.push({
        testId: result.testId._id,
        testTitle: result.testId.title,
        obtainedMarks: result.obtainedMarks,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        submittedAt: result.createdAt,
      });
    });

    // Calculate averages and create leaderboard
    const leaderboard = Array.from(studentStats.values())
      .map((stats) => ({
        ...stats,
        averagePercentage:
          stats.totalMarks > 0 ? Math.round((stats.obtainedMarks / stats.totalMarks) * 100) : 0,
      }))
      .sort((a, b) => b.averagePercentage - a.averagePercentage)
      .map((stat, idx) => ({
        ...stat,
        rank: idx + 1,
        badge: idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '',
      }));

    return NextResponse.json({
      success: true,
      leaderboard,
      totalStudents: leaderboard.length,
      totalResults: results.length,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
