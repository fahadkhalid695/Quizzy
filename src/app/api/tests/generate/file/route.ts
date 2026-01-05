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
    
    // Calculate distribution of question types
    const questionsPerType = Math.floor(numQuestions / questionTypes.length);
    const remainder = numQuestions % questionTypes.length;
    const typeDistributionArr: { type: string; count: number }[] = [];
    questionTypes.forEach((type: string, index: number) => {
      const count = questionsPerType + (index < remainder ? 1 : 0);
      typeDistributionArr.push({ type, count });
    });
    const typeDistribution = typeDistributionArr.map((t: { type: string; count: number }) => 
      `${t.count} ${t.type.replace('_', ' ')} question(s)`
    ).join(', ');

    // Build examples only for the selected types
    const typeExamples: string[] = [];
    if (questionTypes.includes('multiple_choice')) {
      typeExamples.push(`{
    "type": "multiple_choice",
    "question": "What is the main topic discussed in the document?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "This is correct because...",
    "difficulty": "${difficulty}",
    "marks": 1
  }`);
    }
    if (questionTypes.includes('true_false')) {
      typeExamples.push(`{
    "type": "true_false",
    "question": "The document states that X is Y.",
    "options": ["True", "False"],
    "correctAnswer": "True",
    "explanation": "According to the document...",
    "difficulty": "${difficulty}",
    "marks": 1
  }`);
    }
    if (questionTypes.includes('short_answer')) {
      typeExamples.push(`{
    "type": "short_answer",
    "question": "What is the definition of X according to the text?",
    "options": null,
    "correctAnswer": "Expected brief answer",
    "explanation": "The text defines X as...",
    "difficulty": "${difficulty}",
    "marks": 1
  }`);
    }

    // Build type-specific instructions only for selected types
    const typeInstructions: string[] = [];
    if (questionTypes.includes('multiple_choice')) {
      typeInstructions.push(`FOR "multiple_choice" QUESTIONS:
- "type" must be exactly "multiple_choice"
- "options" must be an array of EXACTLY 4 different answer choices
- "correctAnswer" must EXACTLY match one of the 4 options
- Do NOT use True/False as options`);
    }
    if (questionTypes.includes('true_false')) {
      typeInstructions.push(`FOR "true_false" QUESTIONS:
- "type" must be exactly "true_false"  
- "options" must be EXACTLY ["True", "False"]
- "correctAnswer" must be EXACTLY "True" OR "False"`);
    }
    if (questionTypes.includes('short_answer')) {
      typeInstructions.push(`FOR "short_answer" QUESTIONS:
- "type" must be exactly "short_answer"
- "options" must be null (no options)
- "correctAnswer" should be a brief expected answer text`);
    }

    // Emphasize single type if only one selected
    const singleTypeEmphasis = questionTypes.length === 1 
      ? `\n\n⚠️ VERY IMPORTANT: You are ONLY creating "${questionTypes[0].replace('_', ' ')}" questions. ALL ${numQuestions} questions MUST be of type "${questionTypes[0]}". Do NOT create any other question types.`
      : '';

    const prompt = `
You are an expert educator creating quiz questions from educational content.

Content extracted from uploaded file:
---
${extractedContent.substring(0, 15000)}
---

Create EXACTLY ${numQuestions} ${difficulty} difficulty educational questions based on this content.

CRITICAL REQUIREMENTS:
1. Create EXACTLY this distribution: ${typeDistribution}
2. ONLY use these question types: ${questionTypes.join(', ')}${singleTypeEmphasis}

${typeInstructions.join('\n\n')}

Return a JSON array with EXACTLY ${numQuestions} questions. Example format:
[
  ${typeExamples.join(',\n  ')}
]

CRITICAL:
- Create ONLY the question types listed above: ${questionTypes.join(', ')}
- Do NOT create any question types not in that list
- Questions should test understanding of the key concepts
- Return ONLY valid JSON array, no other text
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

    const parsedQuestions = JSON.parse(jsonMatch[0]);
    
    // Post-process and validate each question to ensure correct format
    // ENFORCE the selected question types
    const questions = parsedQuestions.map((q: any) => {
      let questionType = q.type || 'multiple_choice';
      let options = q.options;
      let correctAnswer = q.correctAnswer;
      
      // Get question text - AI might use different field names
      const questionText = q.question || q.text || q.questionText || q.content || '';
      
      // If the AI generated a type that wasn't requested, convert it to the first requested type
      if (!questionTypes.includes(questionType)) {
        questionType = questionTypes[0];
      }
      
      // Validate and fix options based on question type
      if (questionType === 'true_false') {
        // Ensure true/false has correct options
        options = ['True', 'False'];
        // Normalize the correct answer
        if (correctAnswer && typeof correctAnswer === 'string') {
          const normalized = correctAnswer.toLowerCase().trim();
          correctAnswer = normalized === 'true' ? 'True' : 'False';
        }
      } else if (questionType === 'short_answer') {
        // Short answer should have no options
        options = null;
      } else if (questionType === 'multiple_choice') {
        // MCQ should have options
        if (!options || !Array.isArray(options) || options.length < 2) {
          options = ['Option A', 'Option B', 'Option C', 'Option D'];
        }
      }
      
      return {
        type: questionType,
        question: questionText,
        options: options,
        correctAnswer: correctAnswer,
        explanation: q.explanation || '',
        difficulty: q.difficulty || difficulty,
        marks: q.marks || 1,
      };
    });

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
