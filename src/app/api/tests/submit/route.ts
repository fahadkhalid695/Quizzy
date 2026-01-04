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

    const { testId, classId, answers } = await request.json();

    if (!testId || !classId || !answers) {
      return NextResponse.json(
        { error: 'Test ID, class ID, and answers are required' },
        { status: 400 }
      );
    }

    const test = await Test.findById(testId);
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
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

      // Grade based on question type
      if (question.type === 'multiple_choice' || question.type === 'true_false') {
        isCorrect = answer.answer === question.correctAnswer;
        marksObtained = isCorrect ? marks : 0;
      } else if (question.type === 'short_answer') {
        // Use Gemini for grading
        try {
          const gradeResult = await gradeShortAnswer(
            question.question,
            question.correctAnswer,
            answer.answer
          );
          marksObtained = Math.round((gradeResult.score / 100) * marks);
          isCorrect = gradeResult.score >= 70;
        } catch {
          // Fallback: check if answer contains key terms
          marksObtained = answer.answer.toLowerCase().includes(question.correctAnswer.toLowerCase())
            ? marks
            : 0;
          isCorrect = marksObtained > 0;
        }
      } else if (question.type === 'essay') {
        // Essays require teacher grading
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
      cheatingDetails,
      attemptNumber: 1,
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
