import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Test from '@/models/Test';
import TestResult from '@/models/TestResult';
import StudentTest from '@/models/StudentTest';
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
    const { testId, classId, answers, assignedQuestions: submittedQuestions } = body;
    
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

    // For dynamic tests, get the questions that were shown to this student
    let questionsToGrade: any[] = [];
    
    if (test.isDynamic) {
      // PRIORITY: Get from StudentTest record (has correct answers stored securely)
      const studentTest = await StudentTest.findOne({
        testId,
        studentId: payload.userId,
      }).sort({ createdAt: -1 });
      
      if (studentTest && studentTest.assignedQuestions && studentTest.assignedQuestions.length > 0) {
        questionsToGrade = studentTest.assignedQuestions.map((q: any) => {
          const plainQ = q.toObject ? q.toObject() : q;
          return plainQ;
        });
        console.log('Using StudentTest questions for grading (with correct answers):', questionsToGrade.length);
      } else if (submittedQuestions && submittedQuestions.length > 0) {
        // Fallback to submitted questions (but correctAnswer might be missing)
        // Try to match with question pool to get correct answers
        const pool = test.dynamicSettings?.questionPool || test.questions || [];
        questionsToGrade = submittedQuestions.map((sq: any) => {
          // Find matching question in pool by question text
          const poolQuestion = pool.find((pq: any) => {
            const pqPlain = pq.toObject ? pq.toObject() : pq;
            return pqPlain.question === sq.question;
          });
          if (poolQuestion) {
            const plainPool = poolQuestion.toObject ? poolQuestion.toObject() : poolQuestion;
            return {
              ...sq,
              correctAnswer: plainPool.correctAnswer,
            };
          }
          return sq;
        });
        console.log('Using submitted questions matched with pool:', questionsToGrade.length);
      } else {
        // Last fallback: use the dynamic pool
        const pool = test.dynamicSettings?.questionPool || test.questions;
        questionsToGrade = pool.map((q: any) => {
          const plainQ = q.toObject ? q.toObject() : q;
          return plainQ;
        });
        console.log('Fallback: Using full question pool for grading:', questionsToGrade.length);
      }
    } else {
      // Non-dynamic test - use regular questions
      questionsToGrade = test.questions.map((q: any) => {
        const plainQ = q.toObject ? q.toObject() : q;
        return plainQ;
      });
    }
    
    console.log('Questions to grade:', questionsToGrade.length);
    if (questionsToGrade[0]) {
      console.log('First question for grading:', JSON.stringify(questionsToGrade[0], null, 2));
    }

    // Grade the test
    let totalMarks = 0;
    let obtainedMarks = 0;
    const gradedAnswers = [];
    const answerTexts: string[] = [];

    // Grade each answer using the questionsToGrade array
    for (const answer of answers) {
      // For dynamic tests, questionId is index (0, 1, 2, etc.)
      // For non-dynamic tests, it could be _id or index
      let question = null;
      const idx = parseInt(answer.questionId, 10);
      
      // Try by index first (works for both dynamic and non-dynamic)
      if (!isNaN(idx) && idx >= 0 && idx < questionsToGrade.length) {
        question = questionsToGrade[idx];
      }
      
      // If not found by index, try by _id (for non-dynamic tests)
      if (!question) {
        question = questionsToGrade.find(
          (q: any) => q._id?.toString() === answer.questionId
        );
      }

      if (!question) {
        console.log('Question not found for questionId:', answer.questionId, 'in', questionsToGrade.length, 'questions');
        continue;
      }
      
      console.log('Grading question:', { 
        questionId: answer.questionId, 
        questionText: question.question?.substring(0, 50),
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
        questionText: question.question || '',
        questionType: question.type || 'multiple_choice',
        options: question.options || [],
        correctAnswer: question.correctAnswer || '',
        studentAnswer: answer.answer || '',
        answer: answer.answer,
        isCorrect,
        marksObtained,
        marks: marks,
        timeSpent: answer.timeSpent || 0,
      });
    }

    // Detect cheating
    let cheatingScore = 0;
    let cheatingDetails: string[] = [];
    try {
      // Prepare answers for cheating detection using questionsToGrade
      const answersForCheating = answers.map((answer: any, idx: number) => {
        const question = questionsToGrade[idx] || {};
        return {
          question: question.question || '',
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
