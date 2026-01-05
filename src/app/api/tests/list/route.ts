import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Test from '@/models/Test';
import Class from '@/models/Class';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const classId = request.nextUrl.searchParams.get('classId');
    const showAll = request.nextUrl.searchParams.get('showAll') === 'true';
    
    // Verify token for authentication
    let payload = null;
    if (token) {
      payload = await verifyToken(token);
    }

    // If no classId provided, get all tests for the teacher
    if (!classId) {
      if (!payload || payload.role !== 'teacher') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get all classes for this teacher
      const teacherClasses = await Class.find({ teacherId: payload.userId }).select('_id name');
      const classIds = teacherClasses.map(c => c._id.toString());
      const classMap = new Map(teacherClasses.map(c => [c._id.toString(), c.name]));

      // Get all tests for these classes
      const tests = await Test.find({ classId: { $in: classIds } })
        .sort({ createdAt: -1 });

      return NextResponse.json({
        success: true,
        tests: tests.map((test) => ({
          id: test._id,
          title: test.title,
          description: test.description,
          duration: test.duration,
          difficulty: test.difficulty,
          totalMarks: test.totalMarks,
          isPublished: test.isPublished,
          classId: {
            _id: test.classId,
            id: test.classId,
            name: classMap.get(test.classId?.toString()) || 'Unknown Class'
          },
          questionCount: test.questions?.length || 0,
          aiGenerated: test.aiGenerated || false,
          sourceType: test.sourceType || 'manual',
          isDynamic: test.isDynamic || false,
          createdAt: test.createdAt,
        })),
      });
    }

    // Get class name
    const classDoc = await Class.findById(classId).select('name');
    const className = classDoc?.name || 'Unknown Class';

    // If showAll is true and user is teacher, show all tests (including drafts)
    let query: any = { classId };
    
    if (token && showAll) {
      if (payload && payload.role === 'teacher') {
        // Teacher can see all tests
        // query remains { classId }
      } else {
        query.isPublished = true;
      }
    } else {
      query.isPublished = true;
    }

    const tests = await Test.find(query)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      tests: tests.map((test) => ({
        id: test._id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        difficulty: test.difficulty,
        totalMarks: test.totalMarks,
        isPublished: test.isPublished,
        classId: {
          _id: classId,
          id: classId,
          name: className
        },
        questionCount: test.questions?.length || 0,
        aiGenerated: test.aiGenerated || false,
        sourceType: test.sourceType || 'manual',
        isDynamic: test.isDynamic || false,
        createdAt: test.createdAt,
      })),
    });
  } catch (error) {
    console.error('List tests error:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}
