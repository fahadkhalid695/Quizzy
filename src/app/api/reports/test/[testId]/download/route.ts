import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import TestResult from '@/models/TestResult';
import Test from '@/models/Test';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ testId: string }> }
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

    const { testId } = await props.params;
    const format = request.nextUrl.searchParams.get('format') || 'csv';
    const includeAnswers = request.nextUrl.searchParams.get('includeAnswers') === 'true';

    if (!testId || testId === 'undefined') {
      return NextResponse.json({ error: 'Valid Test ID is required' }, { status: 400 });
    }

    // Get the test
    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Verify teacher owns this test
    if (test.teacherId.toString() !== payload.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all results for this test
    const results = await TestResult.find({ testId }).sort({ percentage: -1 });

    // Get student details
    const studentIds = results.map((r: any) => r.studentId);
    const students: any[] = await User.find({ _id: { $in: studentIds } })
      .select('firstName lastName email')
      .lean();
    
    const studentMap = new Map(students.map((s: any) => [s._id.toString(), s]));

    // Calculate statistics
    const totalSubmissions = results.length;
    const avgPercentage = totalSubmissions > 0 
      ? Math.round(results.reduce((sum: number, r: any) => sum + r.percentage, 0) / totalSubmissions)
      : 0;
    const highestScore = results.length > 0 ? Math.max(...results.map((r: any) => r.percentage)) : 0;
    const lowestScore = results.length > 0 ? Math.min(...results.map((r: any) => r.percentage)) : 0;
    const passRate = totalSubmissions > 0
      ? Math.round((results.filter((r: any) => r.percentage >= 40).length / totalSubmissions) * 100)
      : 0;

    // Format data
    const exportData = results.map((result: any, index: number) => {
      const student = studentMap.get(result.studentId.toString());
      const baseData: any = {
        rank: index + 1,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown',
        studentEmail: student?.email || 'N/A',
        totalMarks: result.totalMarks,
        obtainedMarks: result.obtainedMarks,
        percentage: result.percentage,
        status: result.status,
        cheatingScore: result.cheatingScore || 0,
        submittedAt: result.submittedAt ? new Date(result.submittedAt).toLocaleString() : 'N/A',
      };

      if (includeAnswers && result.answers) {
        result.answers.forEach((ans: any, qIndex: number) => {
          const question = test.questions.find((q: any) => q._id.toString() === ans.questionId);
          baseData[`Q${qIndex + 1}_Answer`] = ans.answer;
          baseData[`Q${qIndex + 1}_Correct`] = ans.isCorrect ? 'Yes' : 'No';
          baseData[`Q${qIndex + 1}_Marks`] = `${ans.marksObtained}/${question?.marks || 1}`;
        });
      }

      return baseData;
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Rank',
        'Student Name',
        'Email',
        'Total Marks',
        'Obtained Marks',
        'Percentage',
        'Status',
        'Cheating Score',
        'Submitted At',
      ];

      if (includeAnswers && test.questions.length > 0) {
        test.questions.forEach((_: any, i: number) => {
          headers.push(`Q${i + 1}_Answer`, `Q${i + 1}_Correct`, `Q${i + 1}_Marks`);
        });
      }

      const csvRows = [
        // Summary section
        `"Test Report: ${test.title}"`,
        `"Generated: ${new Date().toLocaleString()}"`,
        `"Total Submissions: ${totalSubmissions}"`,
        `"Average Score: ${avgPercentage}%"`,
        `"Highest Score: ${highestScore}%"`,
        `"Lowest Score: ${lowestScore}%"`,
        `"Pass Rate (>=40%): ${passRate}%"`,
        '',
        headers.join(','),
        ...exportData.map(row => {
          const values = [
            row.rank,
            `"${row.studentName}"`,
            `"${row.studentEmail}"`,
            row.totalMarks,
            row.obtainedMarks,
            `${row.percentage}%`,
            row.status,
            row.cheatingScore,
            `"${row.submittedAt}"`,
          ];

          if (includeAnswers) {
            test.questions.forEach((_: any, i: number) => {
              values.push(
                `"${row[`Q${i + 1}_Answer`] || ''}"`,
                row[`Q${i + 1}_Correct`] || '',
                row[`Q${i + 1}_Marks`] || ''
              );
            });
          }

          return values.join(',');
        }),
      ];

      const csv = csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${test.title.replace(/[^a-z0-9]/gi, '_')}_report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      return NextResponse.json({
        testTitle: test.title,
        testDuration: test.duration,
        testDifficulty: test.difficulty,
        totalQuestions: test.questions.length,
        generatedAt: new Date().toISOString(),
        statistics: {
          totalSubmissions,
          avgPercentage,
          highestScore,
          lowestScore,
          passRate,
        },
        results: exportData,
      });
    } else {
      return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
    }
  } catch (error) {
    console.error('Download test report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
