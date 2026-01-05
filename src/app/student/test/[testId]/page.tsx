'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api-client';
import TestTaking from '@/components/student/TestTaking';
import Results from '@/components/student/Results';

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = params?.testId as string;
  const classId = searchParams?.get('classId') || '';
  const [resultId, setResultId] = useState<string | null>(null);
  const [existingResultId, setExistingResultId] = useState<string | null>(null);
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    // Check if student has already submitted this test
    const checkExistingSubmission = async () => {
      try {
        const response = await api.get<{ results: any[] }>('/api/results/list');
        const existingResult = response.results?.find((r: any) => 
          r.testId?.title || r.testId === testId
        );
        
        // Also check by fetching results for this test specifically
        const resultsResponse = await api.get<{ results: any[] }>(`/api/results/list?testId=${testId}`);
        const testResult = resultsResponse.results?.find((r: any) => {
          const resultTestId = typeof r.testId === 'object' ? r.testId._id : r.testId;
          return resultTestId === testId;
        });
        
        if (testResult) {
          setExistingResultId(testResult.id);
        }
      } catch (error) {
        console.error('Error checking submission:', error);
      } finally {
        setCheckingSubmission(false);
      }
    };
    
    checkExistingSubmission();
  }, [user, router, testId]);

  if (!user) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  if (checkingSubmission) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 animate-pulse">Checking submission status...</p>
        </div>
      </div>
    );
  }

  if (!testId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-gray-400 text-xl">Test not found</p>
          <button
            onClick={() => router.push('/student/tests')}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  // Show existing result if already submitted
  if (existingResultId && !resultId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Already Submitted</h2>
          <p className="text-gray-400 mb-6">You have already submitted this test. Each student can only take a test once.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setResultId(existingResultId)}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
            >
              View Your Results
            </button>
            <button
              onClick={() => router.push('/student/tests')}
              className="w-full px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/20 transition"
            >
              Back to Tests
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (resultId) {
    return <Results resultId={resultId} testId={testId} onClose={() => router.push('/student/dashboard')} />;
  }

  return <TestTaking testId={testId} classId={classId} onSubmit={(id) => setResultId(id)} />;
}
