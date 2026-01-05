import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';
import Test from '@/models/Test';
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
    
    let classIds: string[] = [];
    
    if (classId) {
      classIds = [classId];
    } else {
      // If no classId provided, get all classes the student is enrolled in
      const Class = (await import('@/models/Class')).default;
      const enrolledClasses = await Class.find({
        $or: [
          { students: payload.userId },
          { students: payload.userId.toString() }
        ]
      }).select('_id');
      classIds = enrolledClasses.map((c: any) => c._id.toString());
      
      if (classIds.length === 0) {
        return NextResponse.json({
          success: true,
          leaderboard: [],
          totalStudents: 0,
          totalResults: 0,
          message: 'You are not enrolled in any classes yet'
        });
      }
    }

    // Get all results for the classes
    const results = await TestResult.find({ classId: { $in: classIds } })
      .sort({ percentage: -1, createdAt: -1 });

    // Get all student IDs and test IDs from results
    const studentIds = [...new Set(results.map((r: any) => r.studentId))];
    const testIds = [...new Set(results.map((r: any) => r.testId))];

    // Fetch students and tests
    const students: any[] = await User.find({ 
      $or: [
        { _id: { $in: studentIds } },
        { _id: { $in: studentIds.map((id: any) => id?.toString()).filter(Boolean) } }
      ]
    }).select('firstName lastName email').lean();
    
    const tests: any[] = await Test.find({ 
      $or: [
        { _id: { $in: testIds } },
        { _id: { $in: testIds.map((id: any) => id?.toString()).filter(Boolean) } }
      ]
    }).select('title duration').lean();

    const studentMap = new Map(students.map((s: any) => [s._id.toString(), s]));
    const testMap = new Map(tests.map((t: any) => [t._id.toString(), t]));

    // Group by student and calculate average
    const studentStats = new Map<string, any>();

    results.forEach((result: any) => {
      const studentId = result.studentId?.toString();
      if (!studentId) return;
      
      const student = studentMap.get(studentId);
      const test = testMap.get(result.testId?.toString());
      
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          studentId,
          firstName: student?.firstName || 'Unknown',
          lastName: student?.lastName || 'Student',
          email: student?.email || '',
          totalTests: 0,
          totalMarks: 0,
          obtainedMarks: 0,
          averagePercentage: 0,
          testResults: [],
        });
      }

      const stats = studentStats.get(studentId);
      stats.totalTests += 1;
      stats.totalMarks += result.totalMarks || 0;
      stats.obtainedMarks += result.obtainedMarks || 0;
      stats.testResults.push({
        testId: result.testId,
        testTitle: test?.title || 'Test',
        obtainedMarks: result.obtainedMarks || 0,
        totalMarks: result.totalMarks || 0,
        percentage: result.percentage || 0,
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
