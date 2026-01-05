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
      // AI and Dynamic test fields
      aiGenerated,
      sourceType,
      sourceTopic,
      isDynamic,
      dynamicSettings,
    } = await request.json();

    // Validation
    if (!title || !classId || classId === 'undefined' || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Title, valid class ID, and at least one question are required' },
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

    // Prepare dynamic settings if enabled
    let finalDynamicSettings = null;
    if (isDynamic && dynamicSettings) {
      // Validate dynamic settings
      const questionsPerStudent = Math.min(
        dynamicSettings.questionsPerStudent || questions.length,
        questions.length
      );
      
      finalDynamicSettings = {
        questionPool: dynamicSettings.questionPool || validatedQuestions,
        questionsPerStudent,
        shuffleQuestions: dynamicSettings.shuffleQuestions !== false,
        shuffleOptions: dynamicSettings.shuffleOptions !== false,
        regenerateOnRetake: dynamicSettings.regenerateOnRetake || false,
      };
    }

    const newTest = new Test({
      title: title.trim(),
      description: description?.trim() || '',
      classId,
      teacherId: payload.userId,
      questions: validatedQuestions,
      duration: duration || 60, // minutes
      difficulty: difficulty || 'medium',
      totalMarks: isDynamic && finalDynamicSettings 
        ? Math.round((calculatedTotalMarks / questions.length) * finalDynamicSettings.questionsPerStudent)
        : (totalMarks || calculatedTotalMarks),
      isPublished: false,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
      // AI metadata
      aiGenerated: aiGenerated || false,
      sourceType: sourceType || 'manual',
      sourceTopic: sourceTopic || null,
      // Dynamic test settings
      isDynamic: isDynamic || false,
      dynamicSettings: finalDynamicSettings,
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
          isDynamic: newTest.isDynamic,
          aiGenerated: newTest.aiGenerated,
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
