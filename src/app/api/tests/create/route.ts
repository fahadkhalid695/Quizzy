import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Test from '@/models/Test';
import Class from '@/models/Class';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create tests' }, { status: 403 });
    }

    const {
      title,
      description,
      classId,
      questions,
      duration,
      difficulty,
      totalMarks,
      startTime,
      endTime,
    } = await request.json();

    // Validation
    if (!title || !classId || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Title, class ID, and at least one question are required' },
        { status: 400 }
      );
    }

    // Verify class exists and teacher owns it
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if (classDoc.teacherId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: 'Only class teacher can create tests' },
        { status: 403 }
      );
    }

    // Validate questions
    let calculatedTotalMarks = 0;
    const validatedQuestions = questions.map((q: any) => {
      if (!q.question || !q.type || !q.correctAnswer) {
        throw new Error('Each question must have question text, type, and correct answer');
      }
      const marks = q.marks || 1;
      calculatedTotalMarks += marks;
      return {
        question: q.question,
        type: q.type, // multiple_choice, short_answer, true_false, essay
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        marks: marks,
      };
    });

    const newTest = new Test({
      title: title.trim(),
      description: description?.trim() || '',
      classId,
      teacherId: payload.userId,
      questions: validatedQuestions,
      duration: duration || 60, // minutes
      difficulty: difficulty || 'medium',
      totalMarks: totalMarks || calculatedTotalMarks,
      isPublished: false,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
    });

    await newTest.save();

    return NextResponse.json(
      {
        success: true,
        test: {
          id: newTest._id,
          title: newTest.title,
          description: newTest.description,
          totalMarks: newTest.totalMarks,
          duration: newTest.duration,
          questionCount: newTest.questions.length,
          isPublished: newTest.isPublished,
          createdAt: newTest.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create test' },
      { status: 500 }
    );
  }
}
