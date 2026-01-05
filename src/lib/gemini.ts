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
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
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
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<IQuestion[]> {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })

    const prompt = `
You are an expert test creator. Based on your knowledge about "${searchQuery}", create ${numberOfQuestions} ${difficulty} difficulty questions.

Return a JSON array of questions:
[
  {
    "type": "multiple_choice",
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Correct option",
    "explanation": "Explanation",
    "difficulty": "${difficulty}",
    "marks": 1
  }
]

Ensure questions are educational, accurate, and varied.
Return only valid JSON array.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text_content = response.text()

    const jsonMatch = text_content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0])
      return questions
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
        research = JSON.parse(researchMatch[0])
      } catch (e) {
        research.summary = researchText
      }
    }

    // Step 2: Generate questions based on research
    const questionTypeInstructions = questionTypes.map(type => {
      if (type === 'multiple_choice') return 'Multiple choice questions with 4 options'
      if (type === 'true_false') return 'True/False questions'
      if (type === 'short_answer') return 'Short answer questions requiring brief explanations'
      return type
    }).join(', ')

    const questionsPrompt = `
Based on this research about "${topic}":

Summary: ${research.summary}
Key Facts: ${JSON.stringify(research.keyFacts)}
Common Misconceptions: ${JSON.stringify(research.misconceptions)}
Examples: ${JSON.stringify(research.examples)}

Create ${numberOfQuestions} ${difficulty} difficulty educational questions.
Include these question types: ${questionTypeInstructions}

Return a JSON array:
[
  {
    "type": "multiple_choice" | "true_false" | "short_answer",
    "question": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"] (for multiple_choice, ["True", "False"] for true_false, null for short_answer),
    "correctAnswer": "Correct answer",
    "explanation": "Detailed explanation of why this is correct",
    "difficulty": "${difficulty}",
    "marks": 1
  }
]

Make questions varied, educational, and test real understanding of the topic.
Include questions that test both factual knowledge and conceptual understanding.
For misconceptions, create questions that help clarify them.
Return only valid JSON array.
    `

    const questionsResult = await model.generateContent(questionsPrompt)
    const questionsResponse = await questionsResult.response
    const questionsText = questionsResponse.text()

    let questions: IQuestion[] = []
    const questionsMatch = questionsText.match(/\[[\s\S]*\]/)
    if (questionsMatch) {
      const parsed = JSON.parse(questionsMatch[0])
      questions = parsed.map((q: any) => ({
        type: q.type || QuestionType.MULTIPLE_CHOICE,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty || difficulty,
        marks: q.marks || 1,
      }))
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
