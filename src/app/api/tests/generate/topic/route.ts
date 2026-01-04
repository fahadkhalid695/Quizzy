import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import { researchAndGenerateQuiz } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow longer duration for AI research

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, numQuestions, difficulty, questionTypes } = await request.json();

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const result = await researchAndGenerateQuiz(
      topic,
      numQuestions || 5,
      difficulty || 'medium',
      questionTypes || ['multiple_choice']
    );

    if (result.questions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate questions. Please try a different topic.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: result.questions,
      researchSummary: result.researchSummary,
      topic,
    });
  } catch (error) {
    console.error('Error in topic research:', error);
    return NextResponse.json(
      { error: 'Failed to research and generate questions' },
      { status: 500 }
    );
  }
}
