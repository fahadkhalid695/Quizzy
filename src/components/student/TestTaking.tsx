'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface Question {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay';
  options?: string[];
  explanation: string;
  difficulty: string;
  marks: number;
}

interface TestTakingProps {
  testId: string;
  classId: string;
  onSubmit?: (resultId: string) => void;
}

export default function TestTaking({ testId, classId, onSubmit }: TestTakingProps) {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [tabWarnings, setTabWarnings] = useState(0);
  const notify = useNotify();

  // Fetch test
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await api.get<{ test: any }>(`/api/tests/${testId}`);
        setTest(response.test);
        setTimeLeft((response.test.duration || 60) * 60); // Convert to seconds
      } catch (error) {
        notify.error('Failed to load test');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [testId, notify]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || !test) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [test]);

  // Tab visibility detection - AUTO SUBMIT on tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabWarnings((prev) => {
          const newWarnings = prev + 1;
          if (newWarnings >= 3) {
            notify.error('Too many tab switches detected. Submitting test...');
            handleSubmit();
          } else {
            notify.warning(`Warning: Do not switch tabs! (${newWarnings}/3)`);
          }
          return newWarnings;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleAnswerChange = (questionId: string, answer: any) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questionId, answer);
    setAnswers(newAnswers);
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const answersArray = test.questions.map((q: Question) => ({
        questionId: q._id,
        answer: answers.get(q._id) || '',
        timeSpent: 0, // Could track time per question
      }));

      const response = await api.post<{ result: { id: string } }>('/api/tests/submit', {
        testId,
        classId,
        answers: answersArray,
      });

      notify.success('Test submitted successfully!');
      if (response.result?.id) {
        onSubmit?.(response.result.id);
      } else {
        onSubmit?.('');
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  }, [test, answers, testId, classId, notify, onSubmit, submitting]);

  if (loading) {
    return <div className="text-center py-12">Loading test...</div>;
  }

  if (!test || test.questions.length === 0) {
    return <div className="text-center py-12">No questions found</div>;
  }

  const currentQuestion = test.questions[currentQuestionIdx];
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const allAnswered = Array.from(answers.values()).every((a) => a !== '' && a !== null);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Header */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{test.title}</h1>
          <p className="text-sm text-gray-400">{test.description}</p>
        </div>
        <div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-red-400' : 'text-purple-400'}`}>
          ⏱️ {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 overflow-hidden">
        {/* Question Navigator */}
        <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-y-auto">
          <h2 className="font-bold text-white mb-3">Questions ({answers.size}/{test.questions.length})</h2>
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
            {test.questions.map((q: Question, idx: number) => (
              <button
                key={q._id}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`aspect-square rounded-lg font-bold text-sm transition ${
                  idx === currentQuestionIdx
                    ? 'bg-purple-600 text-white'
                    : answers.has(q._id)
                    ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Content */}
        <div className="lg:col-span-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-y-auto">
          <Card className="border-0 shadow-none">
            <Card.Header
              title={`Question ${currentQuestionIdx + 1}/${test.questions.length}`}
            />
            <Card.Body className="space-y-6">
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">{currentQuestion.question}</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {currentQuestion.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                    {currentQuestion.marks} mark{currentQuestion.marks > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option: string, idx: number) => (
                      <label
                        key={idx}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                          answers.get(currentQuestion._id) === option
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option}
                          checked={answers.get(currentQuestion._id) === option}
                          onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="ml-3 font-medium">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'true_false' && (
                  <div className="grid grid-cols-2 gap-3">
                    {['True', 'False'].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleAnswerChange(currentQuestion._id, option)}
                        className={`py-3 px-4 rounded-lg font-semibold transition ${
                          answers.get(currentQuestion._id) === option
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay') && (
                  <textarea
                    value={answers.get(currentQuestion._id) || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full bg-white/5 border-2 border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                    rows={currentQuestion.type === 'essay' ? 8 : 3}
                  />
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIdx === 0}
        >
          ← Previous
        </Button>

        {currentQuestionIdx < test.questions.length - 1 && (
          <Button
            variant="secondary"
            onClick={() => setCurrentQuestionIdx((prev) => Math.min(test.questions.length - 1, prev + 1))}
          >
            Next →
          </Button>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          isLoading={submitting}
          disabled={!allAnswered || submitting}
        >
          {allAnswered ? '✓ Submit Test' : `Answer all questions (${answers.size}/${test.questions.length})`}
        </Button>
      </div>
    </div>
  );
}
