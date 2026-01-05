import { NextRequest, NextResponse } from 'next/server';
import { generateTestFromWebSearch } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const { url, numQuestions, difficulty, questionTypes } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch content from URL
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
    }

    const html = await response.text();
    // Simple text extraction (in production, use a library like cheerio)
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').substring(0, 5000);

    const questions = await generateTestFromWebSearch(
      text,
      numQuestions || 5,
      difficulty || 'medium',
      questionTypes || ['multiple_choice']
    );

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Generate from web error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    );
  }
}
