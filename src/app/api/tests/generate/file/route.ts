import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken } from '@/lib/auth-middleware';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const numQuestions = parseInt(formData.get('numQuestions') as string) || 10;
    const difficulty = (formData.get('difficulty') as string || 'medium') as 'easy' | 'medium' | 'hard';
    const questionTypesStr = formData.get('questionTypes') as string;
    const questionTypes = questionTypesStr ? JSON.parse(questionTypesStr) : ['multiple_choice'];

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    let extractedContent = '';
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Use Gemini Vision for images
    if (fileType.startsWith('image/')) {
      const imageBuffer = await file.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: fileType,
            data: base64Image,
          },
        },
        'Extract ALL text content from this image. If it contains diagrams, charts, or visual elements, describe them in detail. Include any formulas, equations, or special notation. Return the complete extracted content.',
      ]);
      
      const response = await result.response;
      extractedContent = response.text();
    }
    // For PDFs - use Gemini to process
    else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      const pdfBuffer = await file.arrayBuffer();
      const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Pdf,
          },
        },
        'Extract ALL text content from this PDF document. Include headings, paragraphs, lists, tables, and any other text. Preserve the structure and organization of the content. Return the complete extracted content.',
      ]);
      
      const response = await result.response;
      extractedContent = response.text();
    }
    // For plain text files
    else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      extractedContent = await file.text();
    }
    // For Word documents
    else if (
      fileType.includes('word') ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')
    ) {
      // Convert to buffer and send to Gemini
      const docBuffer = await file.arrayBuffer();
      const base64Doc = Buffer.from(docBuffer).toString('base64');
      
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: fileType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            data: base64Doc,
          },
        },
        'Extract ALL text content from this Word document. Include headings, paragraphs, lists, tables, and any other text. Preserve the structure. Return the complete extracted content.',
      ]);
      
      const response = await result.response;
      extractedContent = response.text();
    }
    // PowerPoint files are not supported by Gemini API
    else if (
      fileType.includes('presentation') ||
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      fileName.endsWith('.pptx') ||
      fileName.endsWith('.ppt')
    ) {
      return NextResponse.json(
        { error: 'PowerPoint files are not supported. Please convert to PDF or copy the text content and use "AI from Text" option instead.' },
        { status: 400 }
      );
    }
    else {
      // Try to read as text
      try {
        extractedContent = await file.text();
      } catch {
        return NextResponse.json(
          { error: 'Unsupported file type. Please upload PDF, images, Word, PowerPoint, or text files.' },
          { status: 400 }
        );
      }
    }

    if (!extractedContent || extractedContent.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract sufficient content from the file. Please try a different file.' },
        { status: 400 }
      );
    }

    // Generate questions from extracted content
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const questionTypeInstructions = questionTypes.map((type: string) => {
      if (type === 'multiple_choice') return 'Multiple choice questions with 4 options';
      if (type === 'true_false') return 'True/False questions';
      if (type === 'short_answer') return 'Short answer questions requiring brief explanations';
      return type;
    }).join(', ');

    // Calculate distribution of question types
    const questionsPerType = Math.floor(numQuestions / questionTypes.length);
    const remainder = numQuestions % questionTypes.length;
    const typeDistribution = questionTypes.map((type: string, index: number) => {
      const count = questionsPerType + (index < remainder ? 1 : 0);
      return `${count} ${type.replace('_', ' ')} question(s)`;
    }).join(', ');

    const prompt = `
You are an expert educator creating quiz questions from educational content.

Content extracted from uploaded file:
---
${extractedContent.substring(0, 15000)}
---

Create EXACTLY ${numQuestions} ${difficulty} difficulty educational questions based on this content.

IMPORTANT - You MUST create this exact distribution of question types:
${typeDistribution}

Question type formats:
- "multiple_choice": Requires "options" array with exactly 4 choices, "correctAnswer" must match one option exactly
- "true_false": Requires "options" array ["True", "False"], "correctAnswer" must be either "True" or "False"  
- "short_answer": NO options array (set to null), "correctAnswer" should be a brief expected answer

Requirements:
1. Questions should test understanding of the key concepts
2. You MUST follow the exact question type distribution specified above
3. For multiple choice, provide 4 options with only one correct answer
4. Include detailed explanations for each answer
5. Ensure questions cover different parts of the content

Return a JSON array with EXACTLY ${numQuestions} questions:
[
  {
    "type": "multiple_choice" | "true_false" | "short_answer",
    "question": "Clear, well-formed question",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (for multiple_choice), ["True", "False"] (for true_false), null (for short_answer),
    "correctAnswer": "The correct answer exactly as it appears in options (or expected answer for short_answer)",
    "explanation": "Detailed explanation of why this is correct",
    "difficulty": "${difficulty}",
    "marks": 1
  }
]

Return ONLY valid JSON array, no additional text.
    `;

    const questionsResult = await model.generateContent(prompt);
    const questionsResponse = await questionsResult.response;
    const questionsText = questionsResponse.text();

    // Parse JSON from response
    const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to generate questions from the content. Please try again.' },
        { status: 500 }
      );
    }

    const questions = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      questions,
      extractedContentPreview: extractedContent.substring(0, 500) + '...',
    });
  } catch (error) {
    console.error('Generate from file error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate questions from file' },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
