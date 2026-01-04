'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TestTaking from '@/components/student/TestTaking';
import Results from '@/components/student/Results';

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.testId as string;
  const [resultId, setResultId] = useState<string | null>(null);

  if (!testId) {
    return <div className="text-center py-12">Test not found</div>;
  }

  if (resultId) {
    return <Results resultId={resultId} testId={testId} onClose={() => router.push('/student/dashboard')} />;
  }

  return <TestTaking testId={testId} classId="" onSubmit={(id) => setResultId(id)} />;
}
