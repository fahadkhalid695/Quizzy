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
    
    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // If showAll is true and user is teacher, show all tests (including drafts)
    let query: any = { classId };
    
    if (token && showAll) {
      const payload = await verifyToken(token);
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
      .populate('classId', 'name')
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
        classId: test.classId,
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
