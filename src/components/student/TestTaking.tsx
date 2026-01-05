'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';

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

export default function TestTaking({ testId, classId: propClassId, onSubmit }: TestTakingProps) {
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [answers, setAnswers] = useState<Map<string, any>>(new Map());
  const [tabWarnings, setTabWarnings] = useState(0);
  const [classId, setClassId] = useState(propClassId);
  const notify = useNotify();
  
  // Use refs to track current values for callbacks
  const submittingRef = useRef(false);
  const testRef = useRef<any>(null);
  const answersRef = useRef<Map<string, any>>(new Map());
  const classIdRef = useRef(propClassId);
  const lastFetchedTestId = useRef<string | null>(null);

  // Keep refs in sync
  useEffect(() => {
    testRef.current = test;
  }, [test]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    classIdRef.current = classId;
  }, [classId]);

  // Submit function
  const doSubmit = useCallback(async () => {
    if (submittingRef.current) return;
    if (!testRef.current) return;
    
    submittingRef.current = true;
    setSubmitting(true);
    setTimerActive(false);

    try {
      const currentTest = testRef.current;
      const currentAnswers = answersRef.current;
      const submitClassId = classIdRef.current || currentTest.classId?._id || currentTest.classId?.id || currentTest.classId;

      if (!submitClassId) {
        notify.error('Class ID is missing');
        submittingRef.current = false;
        setSubmitting(false);
        return;
      }

      const answersArray = currentTest.questions.map((q: Question) => ({
        questionId: q._id,
        answer: currentAnswers.get(q._id) || '',
        timeSpent: 0,
      }));

      const response = await api.post<{ result: { id: string }, alreadySubmitted?: boolean, existingResultId?: string }>('/api/tests/submit', {
        testId,
        classId: submitClassId,
        answers: answersArray,
      });

      notify.success('Test submitted successfully!');
      
      // Small delay to show success message
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (response.result?.id) {
        onSubmit?.(response.result.id);
      } else {
        onSubmit?.('');
      }
      
    } catch (error: any) {
      console.error('Submit error:', error);
      if (error?.message?.includes('already submitted')) {
        notify.warning('You have already submitted this test.');
        await new Promise(resolve => setTimeout(resolve, 500));
        onSubmit?.('');
      } else {
        notify.error(error?.message || 'Failed to submit test');
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
  }, [testId, onSubmit]);

  // Fetch test data
  useEffect(() => {
    if (lastFetchedTestId.current === testId) return;
    lastFetchedTestId.current = testId;
    
    let mounted = true;
    
    const fetchTest = async () => {
      try {
        // First get basic test info
        const testResponse = await api.get<{ test: any }>(`/api/tests/${testId}`);
        
        if (!mounted) return;
        
        const testData = testResponse.test;
        
        // Check if test is dynamic - if so, get personalized questions
        if (testData.isDynamic) {
          try {
            const dynamicResponse = await api.post<{ 
              questions: any[]; 
              isDynamic: boolean; 
              totalMarks: number;
              duration: number;
            }>('/api/tests/generate-student-test', { testId });
            
            if (!mounted) return;
            
            // Replace questions with the dynamic ones
            testData.questions = dynamicResponse.questions.map((q: any, idx: number) => ({
              _id: q.id?.toString() || q._id?.toString() || idx.toString(),
              question: q.question,
              type: q.type || 'multiple_choice',
              options: q.options,
              marks: q.marks || 1,
              difficulty: q.difficulty || 'medium',
            }));
            testData.totalMarks = dynamicResponse.totalMarks;
          } catch (dynamicError) {
            console.error('Failed to get dynamic questions:', dynamicError);
            // Fall back to regular questions if dynamic generation fails
          }
        }
        
        // Ensure all questions have proper structure (normalize non-dynamic questions too)
        if (testData.questions && Array.isArray(testData.questions)) {
          // Debug: Log raw questions before processing
          console.log('Raw questions from API:', testData.questions.length);
          console.log('First raw question:', JSON.stringify(testData.questions[0], null, 2));
          
          testData.questions = testData.questions.map((q: any, idx: number) => ({
            _id: q._id?.toString() || q.id?.toString() || idx.toString(),
            question: q.question || '',
            type: q.type || 'multiple_choice',
            options: q.options || [],
            marks: q.marks || 1,
            difficulty: q.difficulty || 'medium',
            explanation: q.explanation || '',
          }));
          
          // Debug: Log first question structure after processing
          console.log('Processed first question:', JSON.stringify(testData.questions[0], null, 2));
        }
        
        setTest(testData);
        testRef.current = testData;
        
        // Set duration in seconds
        const durationSeconds = (testData.duration || 60) * 60;
        setTimeLeft(durationSeconds);
        
        // Get classId from test if not provided
        if (!propClassId && testData.classId) {
          const testClassId = typeof testData.classId === 'object' 
            ? testData.classId._id || testData.classId.id 
            : testData.classId;
          setClassId(testClassId);
          classIdRef.current = testClassId;
        }
        
        setLoading(false);
        // Start timer after a short delay to ensure everything is ready
        setTimeout(() => {
          if (mounted) setTimerActive(true);
        }, 100);
        
      } catch (error) {
        if (mounted) {
          notify.error('Failed to load test');
          setLoading(false);
        }
      }
    };

    fetchTest();
    
    return () => {
      mounted = false;
    };
  }, [testId, propClassId]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeLeft === null || timeLeft <= 0 || submittingRef.current) {
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timerActive]);

  // Auto submit when time reaches 0
  useEffect(() => {
    if (timeLeft === 0 && timerActive && !submittingRef.current && testRef.current) {
      notify.warning('Time is up! Submitting your test...');
      doSubmit();
    }
  }, [timeLeft, timerActive, doSubmit]);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testRef.current && !submittingRef.current) {
        setTabWarnings(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            notify.error('Too many tab switches. Submitting test...');
            setTimeout(() => doSubmit(), 200);
          } else {
            notify.warning(`Warning: Don't switch tabs! (${newCount}/3)`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [doSubmit]);

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      answersRef.current = newAnswers;
      return newAnswers;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 animate-pulse">Loading test...</p>
        </div>
      </div>
    );
  }

  // Submitting state
  if (submitting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md">
          <div className="w-20 h-20 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-2">Submitting Your Test</h2>
          <p className="text-gray-400 mb-4">Please wait while we process your answers...</p>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!test || !test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-400 text-xl">No questions found in this test</p>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIdx];
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 0;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;
  const answeredCount = answers.size;
  const totalQuestions = test.questions.length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Header - Mobile Responsive */}
      <div className="bg-black/40 backdrop-blur-xl border-b border-white/10 p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-white truncate">{test.title}</h1>
          <p className="text-xs md:text-sm text-gray-400 truncate">{test.description}</p>
        </div>
        <div className={`text-lg md:text-2xl font-bold px-3 py-1 md:px-4 md:py-2 rounded-lg whitespace-nowrap ${
          timeLeft !== null && timeLeft <= 300 
            ? 'text-red-400 bg-red-500/20 animate-pulse' 
            : 'text-purple-400 bg-purple-500/20'
        }`}>
          ⏱️ {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-4 gap-3 md:gap-4 p-3 md:p-4 overflow-hidden">
        {/* Question Navigator - Collapsible on mobile */}
        <div className="lg:col-span-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 lg:overflow-y-auto">
          <h2 className="font-bold text-white mb-2 md:mb-3 text-sm md:text-base">Questions ({answeredCount}/{totalQuestions})</h2>
          <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-5 gap-1 md:gap-2">
            {test.questions.map((q: Question, idx: number) => (
              <button
                key={q._id || idx}
                onClick={() => setCurrentQuestionIdx(idx)}
                className={`aspect-square rounded-md md:rounded-lg font-bold text-xs md:text-sm transition ${
                  idx === currentQuestionIdx
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : answers.has(q._id)
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          
          {/* Progress indicator */}
          <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10">
            <div className="flex justify-between text-xs md:text-sm text-gray-400 mb-1 md:mb-2">
              <span>Progress</span>
              <span>{Math.round((answeredCount / totalQuestions) * 100)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5 md:h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 md:h-2 rounded-full transition-all"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Content - Mobile Responsive */}
        <div className="lg:col-span-3 flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 overflow-y-auto">
          <div className="mb-3 md:mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="text-base md:text-lg font-bold text-white">
              Question {currentQuestionIdx + 1} of {totalQuestions}
            </h3>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-medium rounded">
                {(currentQuestion.type || 'multiple_choice').replace('_', ' ').toUpperCase()}
              </span>
              <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs font-medium rounded">
                {currentQuestion.marks || 1} mark{(currentQuestion.marks || 1) > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <p className="text-lg md:text-xl text-white mb-4 md:mb-6 font-medium">
            {currentQuestion.question || <span className="text-red-400 italic">Question text not available</span>}
          </p>

          {/* Answer Options - Mobile Optimized */}
          <div className="space-y-2 md:space-y-3">
            {(currentQuestion.type === 'multiple_choice' || (!currentQuestion.type && currentQuestion.options)) && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option: string, idx: number) => (
                  <label
                    key={idx}
                    className={`flex items-center p-3 md:p-4 border-2 rounded-lg md:rounded-xl cursor-pointer transition ${
                      answers.get(currentQuestion._id) === option
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                    }`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={answers.get(currentQuestion._id) === option}
                      onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                      className="w-4 h-4 text-purple-500 flex-shrink-0"
                    />
                    <span className="ml-3 text-sm md:text-base text-white break-words">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                {['True', 'False'].map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerChange(currentQuestion._id, option)}
                    className={`py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl font-semibold text-base md:text-lg transition ${
                      answers.get(currentQuestion._id) === option
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
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
                className="w-full bg-white/5 border-2 border-white/20 rounded-lg md:rounded-xl p-3 md:p-4 text-sm md:text-base text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                rows={currentQuestion.type === 'essay' ? 6 : 3}
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation - Mobile Responsive */}
      <div className="bg-black/40 backdrop-blur-xl border-t border-white/10 p-3 md:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
        <Button
          variant="secondary"
          onClick={() => setCurrentQuestionIdx(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIdx === 0}
          className="text-sm md:text-base"
        >
          ← Prev
        </Button>

        <div className="flex gap-2 md:gap-3 justify-end">
          {currentQuestionIdx < totalQuestions - 1 && (
            <Button
              variant="secondary"
              onClick={() => setCurrentQuestionIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
              className="text-sm md:text-base"
            >
              Next →
            </Button>
          )}

          <Button
            variant="primary"
            onClick={doSubmit}
            disabled={submitting}
            className="text-sm md:text-base whitespace-nowrap"
          >
            {answeredCount === totalQuestions 
              ? '✓ Submit' 
              : `Submit (${answeredCount}/${totalQuestions})`
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
