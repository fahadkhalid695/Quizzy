import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Test from '@/models/Test';
import Class from '@/models/Class';
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
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can access this' }, { status: 403 });
    }

    console.log('Fetching tests for student:', payload.userId);

    // Get classes student is enrolled in - check both string and ObjectId formats
    const classes = await Class.find({
      $or: [
        { students: payload.userId },
        { students: payload.userId.toString() }
      ]
    }).select('_id name');
    
    console.log('Student enrolled in classes:', classes.map(c => ({ id: c._id, name: c.name })));
    
    // Create a map of classId to className
    const classMap = new Map(classes.map(c => [c._id.toString(), c.name]));
    const classIds = classes.map((c) => c._id.toString());

    if (classIds.length === 0) {
      console.log('Student not enrolled in any classes');
      return NextResponse.json({
        success: true,
        tests: [],
        message: 'You are not enrolled in any classes yet. Join a class using a class code to see available tests.'
      });
    }

    // Get published tests from enrolled classes - match both string and ObjectId classIds
    const tests = await Test.find({
      $or: [
        { classId: { $in: classIds } },
        { classId: { $in: classes.map(c => c._id) } }
      ],
      isPublished: true,
    }).sort({ createdAt: -1 });

    console.log('Found tests:', tests.length);

    // Get all test results for this student to check submission status
    const testIds = tests.map(t => t._id.toString());
    const submissions = await TestResult.find({
      studentId: payload.userId,
      testId: { $in: testIds }
    }).select('testId percentage obtainedMarks createdAt');

    // Create a map of testId to submission result
    const submissionMap = new Map(
      submissions.map(s => [s.testId.toString(), {
        submitted: true,
        resultId: s._id.toString(),
        percentage: s.percentage,
        obtainedMarks: s.obtainedMarks,
        submittedAt: s.createdAt
      }])
    );

    return NextResponse.json({
      success: true,
      tests: tests.map((test) => {
        const testIdStr = test._id.toString();
        const classIdStr = test.classId?.toString();
        const submission = submissionMap.get(testIdStr);
        
        return {
          id: test._id,
          title: test.title,
          description: test.description,
          duration: test.duration,
          difficulty: test.difficulty,
          totalMarks: test.totalMarks,
          isPublished: test.isPublished,
          classId: {
            id: classIdStr,
            _id: classIdStr,
            name: classMap.get(classIdStr) || 'Unknown Class'
          },
          createdAt: test.createdAt,
          // Submission status
          isSubmitted: !!submission,
          submission: submission || null,
        };
      }),
    });
  } catch (error) {
    console.error('Get available tests error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
