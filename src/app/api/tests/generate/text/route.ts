import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsFromText } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { content, numQuestions, difficulty } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const questions = await generateQuestionsFromText(
      content,
      numQuestions || 5,
      difficulty || 'medium'
    );

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Generate from text error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
