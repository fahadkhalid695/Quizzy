'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface TestItem {
  id: string;
  title: string;
  description: string;
  duration: number;
  difficulty: string;
  totalMarks: number;
  isPublished: boolean;
  classId: {
    id: string;
    name: string;
  };
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('available');
  const router = useRouter();
  const notify = useNotify();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ tests: TestItem[] }>('/api/tests/available');
      setTests(response.tests || []);
    } catch (error) {
      notify.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId: string) => {
    router.push(`/student/test/${testId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="text-center py-12">Loading tests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">📝 Available Tests</h1>
          <p className="text-gray-600 mt-2">Select a test to begin</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'available', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? 'All' : f === 'available' ? 'Available' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <Card>
            <Card.Body>
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📚</div>
                <p className="text-gray-500 text-lg">No tests available yet</p>
              </div>
            </Card.Body>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test) => (
              <Card key={test.id} className="hover:shadow-lg transition cursor-pointer">
                <Card.Body>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">{test.title}</h3>
                    
                    {test.description && (
                      <p className="text-gray-600 text-sm">{test.description}</p>
                    )}

                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Class:</span>
                        <span className="font-medium">{test.classId?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium">⏱️ {test.duration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Marks:</span>
                        <span className="font-medium">⭐ {test.totalMarks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Difficulty:</span>
                        <span className="font-medium capitalize">{test.difficulty}</span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() => handleStartTest(test.id)}
                    >
                      Start Test →
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
