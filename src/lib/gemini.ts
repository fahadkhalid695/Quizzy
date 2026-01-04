import { GoogleGenerativeAI } from '@google/generative-ai'
import { IQuestion, QuestionType } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateQuestionsFromText(
  text: string,
  numberOfQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<IQuestion[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const answersText = studentAnswers
      .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
      .join('\n\n')

    const timeRatio = timeSpent / (testDuration * 60)

    const prompt = `
Analyze the following student test responses for potential cheating indicators:

Answers:
${answersText}

Test Duration: ${testDuration} minutes
Time Spent: ${timeSpent} seconds
Time Ratio: ${timeRatio.toFixed(2)}

Check for:
1. Unusually fast answers (copy-paste patterns)
2. Inconsistent writing style between answers
3. Suspiciously perfect answers for difficult questions
4. Similar patterns suggesting AI generation

Return JSON with:
{
  "cheatingScore": 0-100,
  "details": "explanation of findings"
}

Return only valid JSON.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text_content = response.text()

    const jsonMatch = text_content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    return { cheatingScore: 0, details: 'Could not analyze' }
  } catch (error) {
    console.error('Error detecting cheating:', error)
    return { cheatingScore: 0, details: 'Error in analysis' }
  }
}

export async function generateTestFromWebSearch(
  searchQuery: string,
  numberOfQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<IQuestion[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

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
