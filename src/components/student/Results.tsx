'use client';

import { useEffect, useState } from 'react';
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
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const notify = useNotify();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resultResponse = await api.get<{ result: any }>(`/api/results/${resultId}`);
        setResult(resultResponse.result);

        if (testId) {
          const testResponse = await api.get<{ test: any }>(`/api/tests/${testId}`);
          setTest(testResponse.test);
        }
      } catch (error) {
        notify.error('Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resultId, testId, notify]);

  if (loading) {
    return <div className="text-center py-12">Loading results...</div>;
  }

  if (!result) {
    return <div className="text-center py-12">Results not found</div>;
  }

  const percentage = result.percentage;
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
      {test && (
        <Card>
          <Card.Header title="Answer Review" />
          <Card.Body className="space-y-3">
            {result.answers.map((answer: any, idx: number) => {
              const question = test.questions.find((q: any) => q._id === answer.questionId);
              if (!question) return null;

              const isExpanded = expandedQuestions.has(answer.questionId);

              return (
                <div
                  key={answer.questionId}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => {
                      const newSet = new Set(expandedQuestions);
                      if (newSet.has(answer.questionId)) {
                        newSet.delete(answer.questionId);
                      } else {
                        newSet.add(answer.questionId);
                      }
                      setExpandedQuestions(newSet);
                    }}
                    className="w-full p-4 flex items-start justify-between hover:bg-gray-50 transition"
                  >
                    <div className="text-left flex-1">
                      <div className="font-medium text-gray-900">
                        Q{idx + 1}. {question.question}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {answer.marksObtained}/{question.marks} marks
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
                      <div>
                        <label className="text-sm font-medium text-gray-700">Your Answer:</label>
                        <div className="mt-1 p-3 bg-white rounded border border-gray-200 text-gray-900">
                          {answer.answer || '(Not answered)'}
                        </div>
                      </div>

                      {!answer.isCorrect && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Correct Answer:</label>
                          <div className="mt-1 p-3 bg-green-50 rounded border border-green-200 text-green-900">
                            {question.correctAnswer}
                          </div>
                        </div>
                      )}

                      {question.explanation && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Explanation:</label>
                          <div className="mt-1 p-3 bg-blue-50 rounded border border-blue-200 text-blue-900 text-sm">
                            {question.explanation}
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
      )}

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
