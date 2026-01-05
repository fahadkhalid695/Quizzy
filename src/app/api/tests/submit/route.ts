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

    // For grading, we need to handle both:
    // 1. Non-dynamic tests: questionId is MongoDB ObjectId
    // 2. Dynamic tests: questionId is index (0, 1, 2, etc.)
    
    for (const answer of answers) {
      // Try to find question by _id first (for non-dynamic tests)
      let question = test.questions.find(
        (q: any) => q._id.toString() === answer.questionId
      );
      
      // If not found, try by index (for dynamic tests)
      if (!question) {
        const idx = parseInt(answer.questionId, 10);
        if (!isNaN(idx) && idx >= 0 && idx < test.questions.length) {
          question = test.questions[idx];
        }
      }

      if (!question) {
        console.log('Question not found for questionId:', answer.questionId);
        continue;
      }
      
      console.log('Grading question:', { 
        questionId: answer.questionId, 
        type: question.type,
        studentAnswer: answer.answer,
        correctAnswer: question.correctAnswer 
      });

      const marks = question.marks || 1;
      totalMarks += marks;
      let isCorrect = false;
      let marksObtained = 0;

      // Get and validate student answer - empty answers get 0 marks
      const studentAnswer = (answer.answer?.toString() || '').trim();
      const correctAnswer = (question.correctAnswer?.toString() || '').trim();
      
      // Normalize question type - default to multiple_choice if missing
      const questionType = (question.type || 'multiple_choice').toLowerCase();

      // Grade based on question type
      if (questionType === 'multiple_choice') {
        // For MCQ: exact match (case-insensitive for robustness)
        if (studentAnswer !== '') {
          // Try exact match first
          isCorrect = studentAnswer === correctAnswer;
          
          // If not, try case-insensitive match
          if (!isCorrect) {
            isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
          }
        }
        marksObtained = isCorrect ? marks : 0;
        console.log('MCQ grading:', { studentAnswer, correctAnswer, isCorrect, marksObtained });
        
      } else if (questionType === 'true_false') {
        // For True/False: normalize and compare
        if (studentAnswer !== '') {
          const normalizedStudent = studentAnswer.toLowerCase();
          const normalizedCorrect = correctAnswer.toLowerCase();
          isCorrect = normalizedStudent === normalizedCorrect ||
                      (normalizedStudent === 'true' && normalizedCorrect === 'true') ||
                      (normalizedStudent === 'false' && normalizedCorrect === 'false');
        }
        marksObtained = isCorrect ? marks : 0;
        console.log('True/False grading:', { studentAnswer, correctAnswer, isCorrect, marksObtained });
        
      } else if (questionType === 'short_answer') {
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
      } else if (questionType === 'essay') {
        // Essays require teacher grading - no marks for empty
        marksObtained = 0;
        isCorrect = false;
      } else {
        // Default case: treat as MCQ with case-insensitive matching
        if (studentAnswer !== '' && correctAnswer !== '') {
          isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase();
          marksObtained = isCorrect ? marks : 0;
        }
        console.log('Default grading (unknown type):', { questionType, studentAnswer, correctAnswer, isCorrect, marksObtained });
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
        // Find question by _id or by index
        let question = test.questions.find(
          (q: any) => q._id.toString() === answer.questionId
        );
        if (!question) {
          const idx = parseInt(answer.questionId, 10);
          if (!isNaN(idx) && idx >= 0 && idx < test.questions.length) {
            question = test.questions[idx];
          }
        }
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
