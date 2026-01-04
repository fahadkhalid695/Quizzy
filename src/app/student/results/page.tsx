'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import BackButton from '@/components/common/BackButton';

interface TestResult {
  id: string;
  testId: {
    title: string;
    totalMarks: number;
  };
  score: number;
  percentage: number;
  submittedAt: string;
  timeTaken: number;
}

export default function StudentResultsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const notify = useNotify();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchResults();
  }, [user]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ results: TestResult[] }>('/api/results/list');
      setResults(response.results || []);
    } catch (error) {
      notify.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'from-green-400 to-emerald-400';
    if (percentage >= 70) return 'from-blue-400 to-cyan-400';
    if (percentage >= 50) return 'from-yellow-400 to-orange-400';
    return 'from-red-400 to-pink-400';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton href="/student/dashboard" label="Dashboard" />
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white">📈 My Results</h1>
          <p className="text-gray-400 mt-2">View your test performance history</p>
        </div>

        {/* Stats Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard 
              icon="📝" 
              title="Tests Taken" 
              value={results.length} 
            />
            <StatCard 
              icon="📊" 
              title="Average Score" 
              value={`${(results.reduce((a, b) => a + b.percentage, 0) / results.length).toFixed(1)}%`} 
            />
            <StatCard 
              icon="🏆" 
              title="Best Score" 
              value={`${Math.max(...results.map(r => r.percentage)).toFixed(1)}%`} 
            />
            <StatCard 
              icon="⭐" 
              title="Best Grade" 
              value={getGrade(Math.max(...results.map(r => r.percentage)))} 
            />
          </div>
        )}

        {/* Results List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-white mb-2">No Results Yet</h3>
            <p className="text-gray-400 mb-6">Take a test to see your results here</p>
            <button
              onClick={() => router.push('/student/tests')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
            >
              Browse Tests
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{result.testId?.title || 'Test'}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                      <span>📅 {new Date(result.submittedAt).toLocaleDateString()}</span>
                      <span>⏱️ {Math.round(result.timeTaken / 60)} minutes</span>
                      <span>📊 Score: {result.score}/{result.testId?.totalMarks || 100}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-bold bg-gradient-to-r ${getGradeColor(result.percentage)} bg-clip-text text-transparent`}>
                      {result.percentage.toFixed(1)}%
                    </div>
                    <div className={`text-lg font-semibold bg-gradient-to-r ${getGradeColor(result.percentage)} bg-clip-text text-transparent`}>
                      Grade: {getGrade(result.percentage)}
                    </div>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4 h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${getGradeColor(result.percentage)} transition-all duration-500`}
                    style={{ width: `${result.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: string; title: string; value: string | number }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {value}
          </p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
