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

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI service is not configured. Please add GEMINI_API_KEY to environment variables.' },
        { status: 500 }
      );
    }

    const { text, content, numQuestions, difficulty } = await request.json();
    
    // Support both 'text' and 'content' field names
    const inputText = text || content;

    if (!inputText) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    console.log('Generating questions from text, length:', inputText.length);

    const questions = await generateQuestionsFromText(
      inputText,
      numQuestions || 10,
      difficulty || 'medium'
    );

    console.log('Generated questions count:', questions.length);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate questions. Please try different content or check your API key.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Generate from text error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate questions: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
