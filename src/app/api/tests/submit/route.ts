import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Test from '@/models/Test';
import TestResult from '@/models/TestResult';
import { gradeShortAnswer, detectCheating } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'student') {
      return NextResponse.json({ error: 'Only students can submit tests' }, { status: 403 });
    }

    const body = await request.json();
    const { testId, classId, answers } = body;
    
    console.log('Submit request:', { testId, classId, answersCount: answers?.length });

    if (!testId || testId === 'undefined' || !classId || classId === 'undefined' || !answers) {
      console.log('Missing fields:', { hasTestId: !!testId, hasClassId: !!classId, hasAnswers: !!answers });
      return NextResponse.json(
        { error: 'Valid Test ID, class ID, and answers are required' },
        { status: 400 }
      );
    }

    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Check if student has already submitted this test
    const existingResult = await TestResult.findOne({
      testId,
      studentId: payload.userId,
    });

    if (existingResult) {
      return NextResponse.json({
        error: 'You have already submitted this test',
        alreadySubmitted: true,
        existingResultId: existingResult._id,
      }, { status: 400 });
    }

    // Grade the test
    let totalMarks = 0;
    let obtainedMarks = 0;
    const gradedAnswers = [];
    const answerTexts: string[] = [];

    for (const answer of answers) {
      const question = test.questions.find(
        (q: any) => q._id.toString() === answer.questionId
      );

      if (!question) continue;

      const marks = question.marks || 1;
      totalMarks += marks;
      let isCorrect = false;
      let marksObtained = 0;

      // Get and validate student answer - empty answers get 0 marks
      const studentAnswer = (answer.answer?.toString() || '').trim();

      // Grade based on question type
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        // Empty or missing answers are incorrect
        isCorrect = studentAnswer !== '' && studentAnswer === question.correctAnswer;
        marksObtained = isCorrect ? marks : 0;
      } else if (question.type === 'short_answer') {
        // No marks for empty answers
        if (!studentAnswer) {
          isCorrect = false;
          marksObtained = 0;
        } else {
          // Use Gemini for grading
          try {
            const gradeResult = await gradeShortAnswer(
              question.question,
              studentAnswer,           // Student answer (second param)
              question.correctAnswer   // Correct answer (third param)
            );
            marksObtained = Math.round((gradeResult.score / 100) * marks);
            isCorrect = gradeResult.score >= 70;
          } catch {
            // Fallback: check if answer contains key terms
            const correctAnswerLower = (question.correctAnswer || '').toLowerCase().trim();
            if (correctAnswerLower && studentAnswer.toLowerCase().includes(correctAnswerLower)) {
              marksObtained = marks;
              isCorrect = true;
            } else {
              marksObtained = 0;
              isCorrect = false;
            }
          }
        }
      } else if (question.type === 'essay') {
        // Essays require teacher grading - no marks for empty
        marksObtained = 0;
        isCorrect = false;
      }

      obtainedMarks += marksObtained;
      answerTexts.push(answer.answer);
      gradedAnswers.push({
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect,
        marksObtained,
        timeSpent: answer.timeSpent || 0,
      });
    }

    // Detect cheating
    let cheatingScore = 0;
    let cheatingDetails: string[] = [];
    try {
      // Prepare answers for cheating detection
      const answersForCheating = answers.map((answer: any) => {
        const question = test.questions.find(
          (q: any) => q._id.toString() === answer.questionId
        );
        return {
          question: question?.question || '',
          answer: answer.answer || '',
        };
      });
      
      // Calculate total time spent
      const totalTimeSpent = answers.reduce((sum: number, answer: any) => 
        sum + (answer.timeSpent || 0), 0
      );
      
      const cheatingResult = await detectCheating(
        answersForCheating,
        test.duration,
        totalTimeSpent
      );
      cheatingScore = cheatingResult.cheatingScore;
      cheatingDetails = [cheatingResult.details];
    } catch {
      // Cheating detection optional
    }

    // Create test result
    const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
    const now = new Date();

    const testResult = new TestResult({
      testId,
      studentId: payload.userId,
      classId,
      answers: gradedAnswers,
      totalMarks,
      obtainedMarks,
      percentage: Math.round(percentage),
      status: 'graded',
      cheatingScore,
      cheatingDetails: cheatingDetails.join('; '),
      attemptNumber: 1,
      startedAt: new Date(now.getTime() - (answers.reduce((sum: number, a: any) => sum + (a.timeSpent || 0), 0) * 1000)),
      submittedAt: now,
    });

    await testResult.save();

    return NextResponse.json({
      success: true,
      result: {
        id: testResult._id,
        totalMarks: testResult.totalMarks,
        obtainedMarks: testResult.obtainedMarks,
        percentage: testResult.percentage,
        status: testResult.status,
        cheatingScore: testResult.cheatingScore,
        submittedAt: testResult.createdAt,
      },
    });
  } catch (error) {
    console.error('Submit test error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit test' },
      { status: 500 }
    );
  }
}
