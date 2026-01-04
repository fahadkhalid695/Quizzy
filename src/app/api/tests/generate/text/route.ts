import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsFromText } from '@/lib/gemini';
import { verifyToken } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, content, numQuestions, difficulty } = await request.json();
    
    // Support both 'text' and 'content' field names
    const inputText = text || content;

    if (!inputText) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const questions = await generateQuestionsFromText(
      inputText,
      numQuestions || 10,
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

export const maxDuration = 60;
