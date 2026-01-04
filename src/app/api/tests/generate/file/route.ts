import { NextRequest, NextResponse } from 'next/server';
import { generateQuestionsFromText } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const numQuestions = parseInt(formData.get('numQuestions') as string) || 5;
    const difficulty = formData.get('difficulty') as string || 'medium';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Convert file to text (simplified - in production, use proper libraries)
    let text = '';
    const fileType = file.type;

    if (fileType === 'application/pdf') {
      // For PDF files, use pdf-parse or pdfjs
      // This is a simplified example
      text = 'PDF content extracted'; // In real implementation, parse PDF properly
    } else if (fileType.includes('image')) {
      // For images, could use OCR
      text = 'Image content extracted';
    } else if (
      fileType.includes('word') ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // For DOCX
      text = 'Document content extracted';
    } else if (
      fileType.includes('presentation') ||
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ) {
      // For PPTX
      text = 'Presentation content extracted';
    } else {
      text = await file.text();
    }

    const questions = await generateQuestionsFromText(text, numQuestions, difficulty);

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error('Generate from file error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
