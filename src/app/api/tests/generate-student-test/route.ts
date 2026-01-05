import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Test from '@/models/Test';
import StudentTest from '@/models/StudentTest';

// Utility function to shuffle array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate unique questions for a student from the question pool
function generateStudentQuestions(
  questionPool: any[],
  questionsPerStudent: number,
  shuffleQuestions: boolean,
  shuffleOptions: boolean
) {
  // Select random questions from pool
  let selectedQuestions = shuffleArray(questionPool).slice(0, questionsPerStudent);
  
  // Optionally shuffle the order
  if (shuffleQuestions) {
    selectedQuestions = shuffleArray(selectedQuestions);
  }
  
  // Optionally shuffle options for multiple choice questions
  if (shuffleOptions) {
    selectedQuestions = selectedQuestions.map(q => {
      if (q.type === 'multiple_choice' && q.options && q.options.length > 0) {
        return {
          ...q,
          options: shuffleArray(q.options),
        };
      }
      return q;
    });
  }
  
  return selectedQuestions;
}

export async function POST(request: NextRequest) {
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

    const { testId } = await request.json();

    if (!testId || testId === 'undefined') {
      return NextResponse.json({ error: 'Valid Test ID is required' }, { status: 400 });
    }

    // Find the test
    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (!test.isPublished) {
      return NextResponse.json({ error: 'Test is not published' }, { status: 400 });
    }

    // Check if test is dynamic
    if (!test.isDynamic || !test.dynamicSettings) {
      // Return regular questions for non-dynamic tests
      // Convert Mongoose documents to plain objects
      const questions = test.questions.map((q: any, idx: number) => {
        const plainQ = q.toObject ? q.toObject() : q;
        return {
          id: idx,
          question: plainQ.question || '',
          type: plainQ.type || 'multiple_choice',
          options: plainQ.options || [],
          marks: plainQ.marks || 1,
          difficulty: plainQ.difficulty || 'medium',
        };
      });
      
      console.log('Non-dynamic test - first question:', JSON.stringify(questions[0], null, 2));
      
      return NextResponse.json({
        questions,
        isDynamic: false,
        totalMarks: test.totalMarks,
        duration: test.duration,
      });
    }

    // Check for existing attempt if regenerateOnRetake is false
    if (!test.dynamicSettings.regenerateOnRetake) {
      const existingAttempt = await StudentTest.findOne({
        testId,
        studentId: payload.userId,
        status: { $ne: 'abandoned' },
      }).sort({ createdAt: -1 });

      if (existingAttempt && existingAttempt.assignedQuestions) {
        // Return the same questions from previous attempt
        // Convert to plain objects if needed
        const questions = existingAttempt.assignedQuestions.map((q: any, idx: number) => {
          const plainQ = q.toObject ? q.toObject() : q;
          return {
            id: idx,
            question: plainQ.question || '',
            type: plainQ.type || 'multiple_choice',
            options: plainQ.options || [],
            marks: plainQ.marks || 1,
            difficulty: plainQ.difficulty || 'medium',
          };
        });
        
        return NextResponse.json({
          questions,
          isDynamic: true,
          totalMarks: existingAttempt.assignedQuestions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0),
          duration: test.duration,
          attemptId: existingAttempt._id,
        });
      }
    }

    // Generate new questions for this student
    // Convert Mongoose documents to plain objects to ensure all fields are accessible
    const rawQuestionPool = test.dynamicSettings.questionPool || test.questions;
    const questionPool = rawQuestionPool.map((q: any) => {
      // Handle both Mongoose documents and plain objects
      const plainQ = q.toObject ? q.toObject() : q;
      return {
        question: plainQ.question || '',
        type: plainQ.type || 'multiple_choice',
        options: plainQ.options || [],
        correctAnswer: plainQ.correctAnswer || '',
        explanation: plainQ.explanation || '',
        difficulty: plainQ.difficulty || 'medium',
        marks: plainQ.marks || 1,
      };
    });
    
    console.log('Question pool for dynamic test:', questionPool.length);
    console.log('First question in pool:', JSON.stringify(questionPool[0], null, 2));
    
    const questionsPerStudent = test.dynamicSettings.questionsPerStudent || questionPool.length;
    const shuffleQuestions = test.dynamicSettings.shuffleQuestions !== false;
    const shuffleOptions = test.dynamicSettings.shuffleOptions !== false;

    const studentQuestions = generateStudentQuestions(
      questionPool,
      questionsPerStudent,
      shuffleQuestions,
      shuffleOptions
    );

    // Calculate total marks for this set
    const totalMarks = studentQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    // Store the assigned questions for grading later
    // This will be done when the student actually starts the test
    
    console.log('Dynamic test - returning questions:', studentQuestions.length);
    console.log('First student question:', JSON.stringify(studentQuestions[0], null, 2));
    
    return NextResponse.json({
      questions: studentQuestions.map((q: any, idx: number) => ({
        id: idx,
        question: q.question || '',
        type: q.type || 'multiple_choice',
        options: q.options || [],
        marks: q.marks || 1,
        difficulty: q.difficulty || 'medium',
      })),
      // Include full questions for storing in StudentTest (with answers)
      assignedQuestions: studentQuestions,
      isDynamic: true,
      totalMarks,
      duration: test.duration,
    });
  } catch (error) {
    console.error('Generate student questions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
