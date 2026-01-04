'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import BackButton from '@/components/common/BackButton';

interface Test {
  id: string;
  title: string;
  description: string;
  classId: {
    _id: string;
    name: string;
  };
  questionCount: number;
  duration: number;
  difficulty: string;
  isPublished: boolean;
  totalMarks: number;
  createdAt: string;
}

export default function TeacherTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const notify = useNotify();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchTests();
  }, [user]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ tests: Test[] }>('/api/tests/list');
      setTests(response.tests || []);
    } catch (error) {
      notify.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (testId: string, publish: boolean) => {
    try {
      await api.put(`/api/tests/${testId}`, { isPublished: publish });
      notify.success(publish ? 'Test published!' : 'Test unpublished');
      fetchTests();
    } catch (error) {
      notify.error('Failed to update test');
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton href="/teacher/dashboard" label="Dashboard" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">✏️ All Tests</h1>
            <p className="text-gray-400 mt-1">Manage all your created tests</p>
          </div>
          <button
            onClick={() => router.push('/teacher/classes')}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
          >
            + Create Test
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon="📝" title="Total Tests" value={tests.length} />
          <StatCard icon="✅" title="Published" value={tests.filter(t => t.isPublished).length} />
          <StatCard icon="📄" title="Drafts" value={tests.filter(t => !t.isPublished).length} />
          <StatCard 
            icon="❓" 
            title="Total Questions" 
            value={tests.reduce((sum, t) => sum + (t.questionCount || 0), 0)} 
          />
        </div>

        {/* Tests List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading tests...</div>
        ) : tests.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">✏️</div>
            <h3 className="text-xl font-bold text-white mb-2">No Tests Yet</h3>
            <p className="text-gray-400 mb-6">Create a class first, then add tests to it</p>
            <Button variant="primary" onClick={() => router.push('/teacher/classes')}>
              Go to Classes
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">{test.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          test.isPublished
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {test.isPublished ? '✓ Published' : 'Draft'}
                      </span>
                    </div>
                    {test.description && (
                      <p className="text-gray-400 text-sm mt-1">{test.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                      <span>📚 {test.classId?.name || 'No Class'}</span>
                      <span>📝 {test.questionCount || 0} questions</span>
                      <span>⏱️ {test.duration} min</span>
                      <span className="capitalize">⭐ {test.difficulty}</span>
                      <span>🎯 {test.totalMarks} marks</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/teacher/classes/${test.classId?._id}`)}
                    >
                      View
                    </Button>
                    <Button
                      variant={test.isPublished ? 'danger' : 'success'}
                      size="sm"
                      onClick={() => handlePublish(test.id, !test.isPublished)}
                    >
                      {test.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }: { icon: string; title: string; value: number }) {
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
