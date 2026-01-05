'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ResultsProps {
  resultId: string;
  testId?: string;
  onClose?: () => void;
}

export default function Results({ resultId, testId, onClose }: ResultsProps) {
  const [result, setResult] = useState<any>(null);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const notify = useNotify();
  const hasFetched = useRef(false);

  const fetchData = useCallback(async () => {
    if (!resultId) {
      setError('No result ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const resultResponse = await api.get<{ result: any }>(`/api/results/${resultId}`);
      
      if (!resultResponse.result) {
        setError('Result not found');
        setLoading(false);
        return;
      }
      
      setResult(resultResponse.result);
      
      // Test data might be included in the result response
      if (resultResponse.result.test) {
        setTest(resultResponse.result.test);
      } else if (testId) {
        try {
          const testResponse = await api.get<{ test: any }>(`/api/tests/${testId}`);
          setTest(testResponse.test);
        } catch (testError) {
          console.error('Failed to fetch test details:', testError);
        }
      }
    } catch (err) {
      console.error('Failed to fetch results:', err);
      setError('Failed to load results');
      notify.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }, [resultId, testId]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 animate-pulse">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-white mb-2">{error || 'Results not found'}</h2>
          {onClose && (
            <Button variant="primary" onClick={onClose} className="mt-4">
              Back to Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  const percentage = result.percentage || 0;
  const resultColor =
    percentage >= 80 ? 'green' : percentage >= 60 ? 'blue' : percentage >= 40 ? 'amber' : 'red';
  const resultEmoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚';

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6">
      {/* Score Card */}
      <Card>
        <Card.Body>
          <div className="text-center space-y-4">
            <div className="text-6xl">{resultEmoji}</div>
            <h1 className="text-3xl font-bold text-gray-900">Test Submitted!</h1>

            <div className={`inline-block bg-${resultColor}-100 text-${resultColor}-900 px-6 py-3 rounded-lg`}>
              <div className={`text-4xl font-bold text-${resultColor}-600`}>{percentage}%</div>
              <div className="text-sm font-medium">
                {result.obtainedMarks}/{result.totalMarks} marks
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-2xl font-bold text-gray-900">{result.totalMarks}</div>
                <div className="text-sm text-gray-500">Total Marks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{result.obtainedMarks}</div>
                <div className="text-sm text-gray-500">Obtained</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{result.answers.length}</div>
                <div className="text-sm text-gray-500">Questions</div>
              </div>
            </div>

            {result.cheatingScore > 50 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                <div className="text-sm font-semibold text-red-900">⚠️ Suspicious Activity Detected</div>
                <div className="text-sm text-red-700 mt-1">
                  Similarity score: {result.cheatingScore}%
                </div>
                {result.cheatingDetails && (
                  <ul className="text-xs text-red-700 mt-2 space-y-1">
                    {(typeof result.cheatingDetails === 'string' 
                      ? result.cheatingDetails.split('; ').filter(Boolean)
                      : Array.isArray(result.cheatingDetails) ? result.cheatingDetails : []
                    ).map((detail: string, idx: number) => (
                      <li key={idx}>• {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Answer Review */}
      <Card>
        <Card.Header title="Answer Review" />
        <Card.Body className="space-y-3">
          {result.answers.map((answer: any, idx: number) => {
            // For newer submissions, question details are embedded in the answer
            // For older submissions, try to find from test.questions
            let questionText = answer.questionText;
            let questionType = answer.questionType;
            let options = answer.options;
            let correctAnswer = answer.correctAnswer;
            let explanation = '';
            let questionMarks = answer.marks || 1;
            
            // Fallback to test.questions if question details not in answer
            if (!questionText && test?.questions) {
              const question = test.questions.find((q: any) => 
                q._id === answer.questionId || q._id?.toString() === answer.questionId
              ) || test.questions[idx];
              
              if (question) {
                questionText = question.question;
                questionType = question.type;
                options = question.options;
                correctAnswer = question.correctAnswer;
                explanation = question.explanation;
                questionMarks = question.marks || 1;
              }
            }

            const isExpanded = expandedQuestions.has(answer.questionId || idx.toString());
            const studentAnswer = answer.studentAnswer || answer.answer || '(Not answered)';

            return (
              <div
                key={answer.questionId || idx}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => {
                    const key = answer.questionId || idx.toString();
                    const newSet = new Set(expandedQuestions);
                    if (newSet.has(key)) {
                      newSet.delete(key);
                    } else {
                      newSet.add(key);
                    }
                    setExpandedQuestions(newSet);
                  }}
                  className="w-full p-4 flex items-start justify-between hover:bg-gray-50 transition"
                >
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">
                      Q{idx + 1}. {questionText || 'Question not available'}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {(questionType || 'multiple_choice').replace('_', ' ')}
                      </span>
                      <span>{answer.marksObtained || 0}/{questionMarks} marks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        answer.isCorrect
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                    <span className="text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
                    {/* Show options for MCQ/True-False */}
                    {options && options.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Options:</label>
                        <div className="mt-1 space-y-1">
                          {options.map((opt: string, optIdx: number) => (
                            <div
                              key={optIdx}
                              className={`p-2 rounded border text-sm ${
                                opt === correctAnswer
                                  ? 'bg-green-50 border-green-300 text-green-800'
                                  : opt === studentAnswer && !answer.isCorrect
                                  ? 'bg-red-50 border-red-300 text-red-800'
                                  : opt === studentAnswer
                                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                                  : 'bg-white border-gray-200 text-gray-700'
                              }`}
                            >
                              {opt === correctAnswer && '✓ '}
                              {opt === studentAnswer && opt !== correctAnswer && '✗ '}
                              {opt}
                              {opt === studentAnswer && ' (Your answer)'}
                              {opt === correctAnswer && opt !== studentAnswer && ' (Correct answer)'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* For short answer/essay - show text answers */}
                    {(!options || options.length === 0) && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Your Answer:</label>
                          <div className="mt-1 p-3 bg-white rounded border border-gray-200 text-gray-900">
                            {studentAnswer}
                          </div>
                        </div>

                        {!answer.isCorrect && correctAnswer && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Correct Answer:</label>
                            <div className="mt-1 p-3 bg-green-50 rounded border border-green-200 text-green-900">
                              {correctAnswer}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {explanation && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Explanation:</label>
                        <div className="mt-1 p-3 bg-blue-50 rounded border border-blue-200 text-blue-900 text-sm">
                          {explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card.Body>
      </Card>

      {/* Actions */}
      {onClose && (
        <div className="flex gap-2">
          <Button variant="primary" className="flex-1" onClick={onClose}>
            Back to Dashboard
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => window.print()}>
            Print Results
          </Button>
        </div>
      )}
    </div>
  );
}
