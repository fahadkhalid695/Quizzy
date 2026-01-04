'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import TestForm from '@/components/teacher/TestForm';
import Leaderboard from '@/components/teacher/Leaderboard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ClassTestsPage() {
  const params = useParams();
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
    return <div className="text-center py-12">Class not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            📖 {classData?.name || 'Class'}
          </h1>
          {classData?.description && (
            <p className="text-gray-600 mt-2">{classData.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'tests'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tests ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              activeTab === 'leaderboard'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
              <div className="text-center py-8">Loading tests...</div>
            ) : tests.length === 0 ? (
              <Card>
                <Card.Body>
                  <p className="text-center text-gray-500">No tests yet</p>
                </Card.Body>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tests.map((test) => (
                  <Card key={test.id} className="hover:shadow-lg transition">
                    <Card.Body>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{test.title}</h3>
                          {test.description && (
                            <p className="text-gray-600 text-sm mt-1">{test.description}</p>
                          )}
                          <div className="flex gap-4 mt-3 text-sm">
                            <span className="text-gray-500">
                              📝 {test.questionCount} questions
                            </span>
                            <span className="text-gray-500">⏱️ {test.duration} min</span>
                            <span className="text-gray-500">⭐ {test.difficulty}</span>
                            <span
                              className={`font-medium ${
                                test.isPublished ? 'text-green-600' : 'text-amber-600'
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
                    </Card.Body>
                  </Card>
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
