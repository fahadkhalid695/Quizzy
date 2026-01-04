import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';
import Class from '@/models/Class';
import Test from '@/models/Test';

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

    // Verify teacher owns this class
    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.teacherId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all results for this class
    const results = await TestResult.find({ classId })
      .populate('studentId', 'firstName lastName email')
      .populate('testId', 'title');

    // Get all tests for this class
    const tests = await Test.find({ classId });

    // Calculate statistics
    const studentMap = new Map<string, any>();

    results.forEach((result: any) => {
      const studentId = result.studentId._id.toString();
      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          id: studentId,
          firstName: result.studentId.firstName,
          lastName: result.studentId.lastName,
          email: result.studentId.email,
          totalTests: 0,
          totalMarks: 0,
          obtainedMarks: 0,
          testResults: [],
        });
      }

      const student = studentMap.get(studentId);
      student.totalTests += 1;
      student.totalMarks += result.totalMarks;
      student.obtainedMarks += result.obtainedMarks;
      student.testResults.push({
        testId: result.testId._id,
        testTitle: result.testId.title,
        percentage: result.percentage,
        obtainedMarks: result.obtainedMarks,
        totalMarks: result.totalMarks,
      });
    });

    // Convert map to array and calculate averages
    const students = Array.from(studentMap.values()).map((s) => ({
      ...s,
      averagePercentage: s.totalMarks > 0 ? Math.round((s.obtainedMarks / s.totalMarks) * 100) : 0,
    }));

    // Calculate class statistics
    const totalMarks = students.reduce((sum, s) => sum + s.totalMarks, 0);
    const obtainedMarks = students.reduce((sum, s) => sum + s.obtainedMarks, 0);
    const classAverage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;

    return NextResponse.json({
      success: true,
      report: {
        classId,
        className: classDoc.name,
        totalStudents: classDoc.students.length,
        totalTests: tests.length,
        classAverage,
        totalResults: results.length,
        students: students.sort((a, b) => b.averagePercentage - a.averagePercentage),
      },
    });
  } catch (error) {
    console.error('Get class report error:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
