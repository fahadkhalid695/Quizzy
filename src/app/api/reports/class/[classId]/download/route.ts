import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';
import Class from '@/models/Class';
import Test from '@/models/Test';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ classId: string }> }
) {
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
    const format = request.nextUrl.searchParams.get('format') || 'csv';
    const testId = request.nextUrl.searchParams.get('testId');

    // Verify teacher owns this class
    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.teacherId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build query
    const query: any = { classId };
    if (testId) {
      query.testId = testId;
    }

    // Get all results
    const results = await TestResult.find(query)
      .sort({ createdAt: -1 });

    // Get test details
    const testIds = [...new Set(results.map((r: any) => r.testId))];
    const tests = await Test.find({ 
      $or: [
        { _id: { $in: testIds } },
        { _id: { $in: testIds.map(id => id?.toString()).filter(Boolean) } }
      ]
    }).select('title duration difficulty totalMarks').lean();
    const testMap = new Map(tests.map((t: any) => [t._id.toString(), t]));

    // Get student details
    const studentIds = [...new Set(results.map((r: any) => r.studentId))];
    const students = await User.find({ 
      $or: [
        { _id: { $in: studentIds } },
        { _id: { $in: studentIds.map(id => id?.toString()).filter(Boolean) } }
      ]
    })
      .select('firstName lastName email')
      .lean();
    
    const studentMap = new Map(students.map((s: any) => [s._id.toString(), s]));

    // Format data for export
    const exportData = results.map((result: any) => {
      const student = studentMap.get(result.studentId?.toString());
      const test = testMap.get(result.testId?.toString());
      return {
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        studentEmail: student?.email || 'N/A',
        testTitle: test?.title || 'Unknown Test',
        totalMarks: result.totalMarks,
        obtainedMarks: result.obtainedMarks,
        percentage: result.percentage,
        status: result.status,
        cheatingScore: result.cheatingScore || 0,
        submittedAt: result.submittedAt ? new Date(result.submittedAt).toISOString() : 'N/A',
        timeTaken: result.startedAt && result.submittedAt 
          ? Math.round((new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 60000)
          : 'N/A',
      };
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Student Name',
        'Email',
        'Test',
        'Total Marks',
        'Obtained Marks',
        'Percentage',
        'Status',
        'Cheating Score',
        'Submitted At',
        'Time Taken (min)',
      ];

      const csvRows = [
        headers.join(','),
        ...exportData.map(row => [
          `"${row.studentName}"`,
          `"${row.studentEmail}"`,
          `"${row.testTitle}"`,
          row.totalMarks,
          row.obtainedMarks,
          `${row.percentage}%`,
          row.status,
          row.cheatingScore,
          `"${row.submittedAt}"`,
          row.timeTaken,
        ].join(',')),
      ];

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${classDoc.name.replace(/[^a-z0-9]/gi, '_')}_report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      return NextResponse.json({
        className: classDoc.name,
        generatedAt: new Date().toISOString(),
        totalResults: exportData.length,
        data: exportData,
      });
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Download report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
