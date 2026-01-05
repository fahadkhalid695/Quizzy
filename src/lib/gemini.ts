import { GoogleGenerativeAI } from '@google/generative-ai'
import { IQuestion, QuestionType } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Use gemini-2.0-flash for text generation (currently available model)
const MODEL_NAME = 'gemini-2.0-flash'

export async function generateQuestionsFromText(
  text: string,
  numberOfQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<IQuestion[]> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const prompt = `
Generate ${numberOfQuestions} educational questions of ${difficulty} difficulty from the following text.

Text: ${text}

Return a JSON array of questions with the following structure:
[
  {
    "type": "multiple_choice",
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Correct option",
    "explanation": "Explanation of the answer",
    "difficulty": "${difficulty}",
    "marks": 1
  }
]

Make sure the questions are clear, accurate, and varied in type.
Only return valid JSON array, no extra text.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text_content = response.text()

    // Parse JSON from response
    const jsonMatch = text_content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0])
      return questions.map((q: any) => ({
        type: q.type || QuestionType.MULTIPLE_CHOICE,
        question: q.question || q.text || q.questionText || q.content || '',
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        difficulty: q.difficulty || difficulty,
        marks: q.marks || 1,
      }))
    }

    return []
  } catch (error) {
    console.error('Error generating questions:', error)
    return []
  }
}

export async function gradeShortAnswer(
  question: string,
  studentAnswer: string,
  correctAnswer: string
): Promise<{ isCorrect: boolean; score: number; feedback: string }> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const prompt = `
You are an expert teacher grading a student's answer to a short-answer question.

Question: ${question}
Student's Answer: ${studentAnswer}
Expected/Sample Answer: ${correctAnswer}

Provide a JSON response with:
1. isCorrect: boolean (true if answer is substantially correct)
2. score: number (0-100, percentage score)
3. feedback: string (brief constructive feedback)

Only return valid JSON, no extra text.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text_content = response.text()

    const jsonMatch = text_content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return { isCorrect: false, score: 0, feedback: 'Could not grade the answer' }
  } catch (error) {
    console.error('Error grading answer:', error)
    return { isCorrect: false, score: 0, feedback: 'Error in grading' }
  }
}

export async function detectCheating(
  studentAnswers: { question: string; answer: string }[],
  testDuration: number,
  timeSpent: number
): Promise<{ cheatingScore: number; details: string }> {
  try {
    // Basic time-based cheating detection (without AI)
    const timeRatio = timeSpent / (testDuration * 60);
    let cheatingScore = 0;
    let details: string[] = [];

    // Too fast completion (less than 20% of allotted time)
    if (timeRatio < 0.2 && studentAnswers.length > 3) {
      cheatingScore += 30;
      details.push(`Completed very quickly (${Math.round(timeRatio * 100)}% of time used)`);
    }

    // Check for very long identical answers that might be copy-pasted
    const longAnswers = studentAnswers.filter(a => a.answer && a.answer.length > 200);
    if (longAnswers.length > 2) {
      // Check if multiple long answers have similar patterns
      const answerLengths = longAnswers.map(a => a.answer.length);
      const avgLength = answerLengths.reduce((a, b) => a + b, 0) / answerLengths.length;
      const variance = answerLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / answerLengths.length;
      
      // Low variance in long answer lengths could indicate copy-paste
      if (variance < 100 && avgLength > 300) {
        cheatingScore += 20;
        details.push('Suspiciously uniform answer lengths detected');
      }
    }

    // Try AI-based detection if available
    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });

      const answersText = studentAnswers
        .slice(0, 5) // Only analyze first 5 answers to save tokens
        .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
        .join('\n\n');

      const prompt = `
Analyze these student test responses for potential academic dishonesty indicators (0-100 score):

${answersText}

Test Duration: ${testDuration} minutes
Time Spent: ${Math.round(timeSpent / 60)} minutes

Check for:
1. Unusually sophisticated vocabulary for a student
2. Perfect formatting suggesting copy-paste
3. Inconsistent writing styles between answers

Return ONLY a JSON object: {"cheatingScore": number, "details": "brief explanation"}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text_content = response.text();

      const jsonMatch = text_content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiResult = JSON.parse(jsonMatch[0]);
        // Combine scores (weighted average)
        cheatingScore = Math.round((cheatingScore + aiResult.cheatingScore) / 2);
        if (aiResult.details && aiResult.details !== 'No suspicious patterns detected') {
          details.push(aiResult.details);
        }
      }
    } catch (aiError) {
      // AI detection failed, use only basic detection
      console.log('AI cheating detection unavailable, using basic detection');
    }

    return { 
      cheatingScore: Math.min(cheatingScore, 100), 
      details: details.length > 0 ? details.join('. ') : 'No suspicious patterns detected' 
    };
  } catch (error) {
    console.error('Error detecting cheating:', error);
    return { cheatingScore: 0, details: 'Could not analyze' };
  }
}

export async function generateTestFromWebSearch(
  searchQuery: string,
  numberOfQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard',
  questionTypes: ('multiple_choice' | 'true_false' | 'short_answer')[] = ['multiple_choice']
): Promise<IQuestion[]> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    // Calculate distribution of question types
    const questionsPerType = Math.floor(numberOfQuestions / questionTypes.length);
    const remainder = numberOfQuestions % questionTypes.length;
    const typeDistributionArr: { type: string; count: number }[] = [];
    questionTypes.forEach((type, index) => {
      const count = questionsPerType + (index < remainder ? 1 : 0);
      typeDistributionArr.push({ type, count });
    });
    const typeDistribution = typeDistributionArr.map(t => `${t.count} ${t.type.replace('_', ' ')} question(s)`).join(', ');

    // Build examples only for the selected types
    const typeExamples: string[] = [];
    if (questionTypes.includes('multiple_choice')) {
      typeExamples.push(`{
    "type": "multiple_choice",
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": "Paris",
    "explanation": "Paris is the capital city of France.",
    "difficulty": "${difficulty}",
    "marks": 1
  }`);
    }
    if (questionTypes.includes('true_false')) {
      typeExamples.push(`{
    "type": "true_false",
    "question": "The Earth is flat.",
    "options": ["True", "False"],
    "correctAnswer": "False",
    "explanation": "The Earth is approximately spherical.",
    "difficulty": "${difficulty}",
    "marks": 1
  }`);
    }
    if (questionTypes.includes('short_answer')) {
      typeExamples.push(`{
    "type": "short_answer",
    "question": "Name the largest planet in our solar system.",
    "options": null,
    "correctAnswer": "Jupiter",
    "explanation": "Jupiter is the largest planet.",
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
      ? `\n\n⚠️ VERY IMPORTANT: You are ONLY creating "${questionTypes[0].replace('_', ' ')}" questions. ALL ${numberOfQuestions} questions MUST be of type "${questionTypes[0]}". Do NOT create any other question types.`
      : '';

    const prompt = `
You are an expert test creator. Based on your knowledge about "${searchQuery}", create EXACTLY ${numberOfQuestions} ${difficulty} difficulty questions.

CRITICAL REQUIREMENTS:
1. Create EXACTLY this distribution: ${typeDistribution}
2. ONLY use these question types: ${questionTypes.join(', ')}${singleTypeEmphasis}

${typeInstructions.join('\n\n')}

Return a JSON array with EXACTLY ${numberOfQuestions} questions. Example format:
[
  ${typeExamples.join(',\n  ')}
]

CRITICAL:
- Create ONLY the question types listed above: ${questionTypes.join(', ')}
- Do NOT create any question types not in that list
- Return ONLY valid JSON array, no other text
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text_content = response.text()

    const jsonMatch = text_content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      
      // Post-process and validate each question - ENFORCE selected types
      return parsed.map((q: any) => {
        let questionType = q.type || QuestionType.MULTIPLE_CHOICE;
        let options = q.options;
        let correctAnswer = q.correctAnswer;
        
        // Get question text - AI might use different field names
        const questionText = q.question || q.text || q.questionText || q.content || '';
        
        // If the AI generated a type that wasn't requested, convert it to the first requested type
        if (!questionTypes.includes(questionType as any)) {
          questionType = questionTypes[0];
        }
        
        // Validate and fix options based on question type
        if (questionType === 'true_false') {
          options = ['True', 'False'];
          if (correctAnswer && typeof correctAnswer === 'string') {
            const normalized = correctAnswer.toLowerCase().trim();
            correctAnswer = normalized === 'true' ? 'True' : 'False';
          }
        } else if (questionType === 'short_answer') {
          options = null;
        } else if (questionType === 'multiple_choice') {
          if (!options || !Array.isArray(options) || options.length < 4) {
            // Keep the question but ensure it has proper format
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
    }

    return []
  } catch (error) {
    console.error('Error generating questions from web search:', error)
    return []
  }
}

export async function researchAndGenerateQuiz(
  topic: string,
  numberOfQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard',
  questionTypes: ('multiple_choice' | 'true_false' | 'short_answer')[] = ['multiple_choice']
): Promise<{ questions: IQuestion[]; researchSummary: string }> {
  try {
    console.log('researchAndGenerateQuiz called with:', { topic, numberOfQuestions, difficulty, questionTypes });
    console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
    console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
    
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })
    console.log('Model initialized:', MODEL_NAME);

    // Step 1: Research the topic
    const researchPrompt = `
You are an expert researcher and educator. Research the following topic thoroughly and provide comprehensive information that can be used to create educational quiz questions.

Topic: "${topic}"

Provide:
1. A comprehensive summary of the topic (3-5 paragraphs covering key concepts, facts, history, and important details)
2. Key facts and figures
3. Common misconceptions
4. Real-world applications or examples

Format your response as JSON:
{
  "summary": "Comprehensive research summary...",
  "keyFacts": ["fact1", "fact2", ...],
  "misconceptions": ["misconception1", ...],
  "examples": ["example1", ...]
}

Return only valid JSON.
    `

    console.log('Sending research prompt to Gemini...');
    const researchResult = await model.generateContent(researchPrompt)
    console.log('Research result received');
    const researchResponse = await researchResult.response
    const researchText = researchResponse.text()
    console.log('Research text length:', researchText.length);

    let research = { summary: '', keyFacts: [], misconceptions: [], examples: [] }
    const researchMatch = researchText.match(/\{[\s\S]*\}/)
    if (researchMatch) {
      try {
        const parsed = JSON.parse(researchMatch[0])
        // Ensure summary is a string, not an object
        research.summary = typeof parsed.summary === 'string' 
          ? parsed.summary 
          : (parsed.summary ? JSON.stringify(parsed.summary) : '');
        research.keyFacts = Array.isArray(parsed.keyFacts) ? parsed.keyFacts : [];
        research.misconceptions = Array.isArray(parsed.misconceptions) ? parsed.misconceptions : [];
        research.examples = Array.isArray(parsed.examples) ? parsed.examples : [];
      } catch (e) {
        // If JSON parsing fails, extract just the text content without JSON formatting
        const cleanText = researchText.replace(/[\{\}\[\]"]/g, '').replace(/\s+/g, ' ').trim();
        research.summary = cleanText.substring(0, 500) + (cleanText.length > 500 ? '...' : '');
      }
    } else {
      // No JSON found, use the raw text
      research.summary = researchText.substring(0, 500) + (researchText.length > 500 ? '...' : '');
    }

    // Step 2: Generate questions based on research
    const questionTypeInstructions = questionTypes.map(type => {
      if (type === 'multiple_choice') return 'Multiple choice questions with 4 options'
      if (type === 'true_false') return 'True/False questions'
      if (type === 'short_answer') return 'Short answer questions requiring brief explanations'
      return type
    }).join(', ')

    // Calculate distribution of question types
    const questionsPerType = Math.floor(numberOfQuestions / questionTypes.length);
    const remainder = numberOfQuestions % questionTypes.length;
    
    // Build explicit type distribution
    const typeDistributionArr: { type: string; count: number }[] = [];
    questionTypes.forEach((type, index) => {
      const count = questionsPerType + (index < remainder ? 1 : 0);
      typeDistributionArr.push({ type, count });
    });
    
    const typeDistribution = typeDistributionArr.map(t => `${t.count} ${t.type.replace('_', ' ')} question(s)`).join(', ');

    // Build examples only for the selected types
    const typeExamples: string[] = [];
    if (questionTypes.includes('multiple_choice')) {
      typeExamples.push(`{
    "type": "multiple_choice",
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": "Paris",
    "explanation": "Paris is the capital city of France.",
    "difficulty": "${difficulty}",
    "marks": 1
  }`);
    }
    if (questionTypes.includes('true_false')) {
      typeExamples.push(`{
    "type": "true_false",
    "question": "The Earth is flat.",
    "options": ["True", "False"],
    "correctAnswer": "False",
    "explanation": "The Earth is approximately spherical.",
    "difficulty": "${difficulty}",
    "marks": 1
  }`);
    }
    if (questionTypes.includes('short_answer')) {
      typeExamples.push(`{
    "type": "short_answer",
    "question": "Name the largest planet in our solar system.",
    "options": null,
    "correctAnswer": "Jupiter",
    "explanation": "Jupiter is the largest planet.",
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
- Do NOT use True/False as options for multiple choice`);
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
      ? `\n\n⚠️ VERY IMPORTANT: You are ONLY creating "${questionTypes[0].replace('_', ' ')}" questions. ALL ${numberOfQuestions} questions MUST be of type "${questionTypes[0]}". Do NOT create any other question types.`
      : '';

    const questionsPrompt = `
Based on this research about "${topic}":

Summary: ${research.summary}
Key Facts: ${JSON.stringify(research.keyFacts)}
Common Misconceptions: ${JSON.stringify(research.misconceptions)}
Examples: ${JSON.stringify(research.examples)}

Create EXACTLY ${numberOfQuestions} ${difficulty} difficulty educational questions.

CRITICAL REQUIREMENTS:
1. Create EXACTLY this distribution: ${typeDistribution}
2. ONLY use these question types: ${questionTypes.join(', ')}${singleTypeEmphasis}

${typeInstructions.join('\n\n')}

Return a JSON array with EXACTLY ${numberOfQuestions} questions. Example format:
[
  ${typeExamples.join(',\n  ')}
]

CRITICAL: 
- Create ONLY the question types listed above: ${questionTypes.join(', ')}
- Do NOT create any question types not in that list
- Return ONLY valid JSON array, no other text
    `

    const questionsResult = await model.generateContent(questionsPrompt)
    const questionsResponse = await questionsResult.response
    const questionsText = questionsResponse.text()
    
    console.log('Raw AI response text:', questionsText.substring(0, 500));

    let questions: IQuestion[] = []
    const questionsMatch = questionsText.match(/\[[\s\S]*\]/)
    if (questionsMatch) {
      const parsed = JSON.parse(questionsMatch[0])
      
      console.log('Parsed questions from AI:', JSON.stringify(parsed[0], null, 2));
      
      // Post-process and validate each question to ensure correct format
      // Also ENFORCE the selected question types
      questions = parsed.map((q: any) => {
        let questionType = q.type || QuestionType.MULTIPLE_CHOICE;
        let options = q.options;
        let correctAnswer = q.correctAnswer;
        
        // Get question text - AI might use different field names
        const questionText = q.question || q.text || q.questionText || q.content || '';
        
        console.log('Processing question:', { 
          originalQuestion: q.question, 
          fallbackText: q.text,
          resultingQuestionText: questionText 
        });
        
        // If the AI generated a type that wasn't requested, convert it to the first requested type
        if (!questionTypes.includes(questionType as any)) {
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
          // MCQ should have 4 options that are NOT just True/False
          if (!options || !Array.isArray(options) || options.length < 2) {
            options = ['Option A', 'Option B', 'Option C', 'Option D'];
          }
          // If options are just True/False, this is wrongly typed - but keep as is
          // The AI should have generated proper options
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
      })
    }

    return {
      questions,
      researchSummary: research.summary || 'Research completed successfully.',
    }
  } catch (error: any) {
    console.error('Error in research and generate quiz:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    
    // Re-throw the error with more details so the API can return it
    throw new Error(`Gemini API Error: ${error?.message || 'Unknown error'}`);
  }
}
