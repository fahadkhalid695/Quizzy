'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import TestForm from '@/components/teacher/TestForm';
import Leaderboard from '@/components/teacher/Leaderboard';
import Button from '@/components/ui/Button';
import BackButton from '@/components/common/BackButton';

export default function ClassTestsPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string;
  const [classData, setClassData] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTestForm, setShowTestForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'leaderboard'>('tests');
  const notify = useNotify();

  useEffect(() => {
    if (!classId) return;
    fetchClassData();
    fetchTests();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const response = await api.get<{ class: any }>(`/api/classes/${classId}`);
      setClassData(response.class);
    } catch (error) {
      notify.error('Failed to load class');
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ tests: any[] }>(`/api/tests/list?classId=${classId}`);
      setTests(response.tests || []);
    } catch (error) {
      notify.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  if (!classId) {
    return <div className="min-h-screen bg-slate-900 text-center py-12 text-gray-400">Class not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <BackButton href="/teacher/classes" label="Classes" />
        </div>

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">
            📖 {classData?.name || 'Class'}
          </h1>
          {classData?.description && (
            <p className="text-gray-400 mt-2">{classData.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/20">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'tests'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Tests ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'leaderboard'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            {!showTestForm && (
              <Button
                variant="primary"
                onClick={() => setShowTestForm(true)}
                className="w-full md:w-auto"
              >
                + Create Test
              </Button>
            )}

            {showTestForm && (
              <TestForm
                classId={classId}
                onSuccess={() => {
                  setShowTestForm(false);
                  fetchTests();
                }}
              />
            )}

            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading tests...</div>
            ) : tests.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-gray-400">No tests yet. Create your first test!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tests.map((test) => (
                  <div 
                    key={test.id} 
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 hover:border-purple-400/50 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{test.title}</h3>
                        {test.description && (
                          <p className="text-gray-400 text-sm mt-1">{test.description}</p>
                        )}
                        <div className="flex gap-4 mt-3 text-sm">
                          <span className="text-gray-400">
                            📝 {test.questionCount} questions
                          </span>
                          <span className="text-gray-400">⏱️ {test.duration} min</span>
                          <span className="text-gray-400">⭐ {test.difficulty}</span>
                          <span
                            className={`font-medium ${
                              test.isPublished ? 'text-green-400' : 'text-amber-400'
                            }`}
                          >
                            {test.isPublished ? '✓ Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <Button variant="secondary" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && <Leaderboard classId={classId} />}
      </div>
    </div>
  );
}
