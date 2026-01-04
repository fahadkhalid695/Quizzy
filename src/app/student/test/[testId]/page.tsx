'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import TestTaking from '@/components/student/TestTaking';
import Results from '@/components/student/Results';

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;
  const [resultId, setResultId] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return <div className="min-h-screen bg-slate-900" />;
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

  if (resultId) {
    return <Results resultId={resultId} testId={testId} onClose={() => router.push('/student/dashboard')} />;
  }

  return <TestTaking testId={testId} classId="" onSubmit={(id) => setResultId(id)} />;
}
