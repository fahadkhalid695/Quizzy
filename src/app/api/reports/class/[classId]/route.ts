import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';
import Class from '@/models/Class';
import Test from '@/models/Test';
import User from '@/models/User';

export async function GET(request: NextRequest, props: { params: Promise<{ classId: string }> }) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can access this' }, { status: 403 });
    }

    const { classId } = await props.params;

    if (!classId || classId === 'undefined') {
      return NextResponse.json({ error: 'Valid Class ID is required' }, { status: 400 });
    }

    // Verify teacher owns this class
    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.teacherId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all results for this class (without populate since IDs are strings)
    const results = await TestResult.find({ classId });

    // Get all tests for this class
    const tests = await Test.find({ classId });
    const testMap = new Map(tests.map(t => [t._id.toString(), t]));

    // Get all student IDs from results and class
    const studentIds = [...new Set([
      ...results.map((r: any) => r.studentId),
      ...(classDoc.students || [])
    ])];

    // Fetch all students - handle both string and ObjectId formats
    const students = await User.find({ 
      $or: [
        { _id: { $in: studentIds } },
        { _id: { $in: studentIds.filter(id => id).map(id => id.toString()) } }
      ]
    });
    const studentMap = new Map(students.map(s => [s._id.toString(), s]));

    // Calculate statistics per student
    const studentStatsMap = new Map<string, any>();

    results.forEach((result: any) => {
      const studentId = result.studentId?.toString();
      if (!studentId) return;
      
      const student = studentMap.get(studentId);
      const test = testMap.get(result.testId?.toString());
      
      if (!studentStatsMap.has(studentId)) {
        studentStatsMap.set(studentId, {
          id: studentId,
          firstName: student?.firstName || 'Unknown',
          lastName: student?.lastName || 'Student',
          email: student?.email || '',
          totalTests: 0,
          totalMarks: 0,
          obtainedMarks: 0,
          testResults: [],
        });
      }

      const stats = studentStatsMap.get(studentId);
      stats.totalTests += 1;
      stats.totalMarks += result.totalMarks || 0;
      stats.obtainedMarks += result.obtainedMarks || 0;
      stats.testResults.push({
        testId: result.testId,
        testTitle: test?.title || 'Test',
        percentage: result.percentage || 0,
        obtainedMarks: result.obtainedMarks || 0,
        totalMarks: result.totalMarks || 0,
      });
    });

    // Convert map to array and calculate averages
    const studentsList = Array.from(studentStatsMap.values()).map((s) => ({
      ...s,
      averagePercentage: s.totalMarks > 0 ? Math.round((s.obtainedMarks / s.totalMarks) * 100) : 0,
    }));

    // Sort by performance
    studentsList.sort((a, b) => b.averagePercentage - a.averagePercentage);

    // Calculate class statistics
    const totalMarksSum = studentsList.reduce((sum, s) => sum + s.totalMarks, 0);
    const obtainedMarksSum = studentsList.reduce((sum, s) => sum + s.obtainedMarks, 0);
    const classAverage = totalMarksSum > 0 ? Math.round((obtainedMarksSum / totalMarksSum) * 100) : 0;

    // Calculate performance distribution
    let excellent = 0, good = 0, average = 0, needsWork = 0;
    studentsList.forEach(s => {
      if (s.averagePercentage >= 90) excellent++;
      else if (s.averagePercentage >= 70) good++;
      else if (s.averagePercentage >= 50) average++;
      else needsWork++;
    });

    const totalWithResults = studentsList.length || 1; // Avoid division by zero
    const excellentPercentage = (excellent / totalWithResults) * 100;
    const goodPercentage = (good / totalWithResults) * 100;
    const averagePercentage = (average / totalWithResults) * 100;
    const needsWorkPercentage = (needsWork / totalWithResults) * 100;

    // Get top performers (top 5)
    const topPerformers = studentsList.slice(0, 5).map(s => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      averageScore: s.averagePercentage,
    }));

    return NextResponse.json({
      success: true,
      report: {
        classId,
        className: classDoc.name,
        totalStudents: classDoc.students?.length || 0,
        totalTests: tests.length,
        classAverage,
        totalResults: results.length,
        students: studentsList,
      },
      // Analytics data (for analytics page)
      totalStudents: classDoc.students?.length || 0,
      totalTests: tests.length,
      totalSubmissions: results.length,
      averageScore: classAverage,
      excellentPercentage,
      goodPercentage,
      averagePercentage,
      needsWorkPercentage,
      topPerformers,
    });
  } catch (error) {
    console.error('Get class report error:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
