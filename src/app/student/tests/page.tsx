'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import BackButton from '@/components/common/BackButton';
import Link from 'next/link';

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

interface ClassItem {
  id: string;
  name: string;
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'completed'>('available');
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const router = useRouter();
  const notify = useNotify();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsRes, classesRes] = await Promise.all([
        api.get<{ tests: TestItem[] }>('/api/tests/available'),
        api.get<{ classes: ClassItem[] }>('/api/classes/enrolled'),
      ]);
      setTests(testsRes.tests || []);
      setClasses(classesRes.classes || []);
    } catch (error) {
      console.error('Failed to load data:', error);
      notify.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      notify.error('Please enter a class code');
      return;
    }

    setJoining(true);
    try {
      await api.post('/api/classes/join', { code: joinCode.trim() });
      notify.success('Successfully joined the class!');
      setJoinCode('');
      fetchData(); // Refresh data
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to join class');
    } finally {
      setJoining(false);
    }
  };

  const handleStartTest = (testId: string) => {
    router.push(`/student/test/${testId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
        <div className="text-center py-12 text-gray-400">Loading tests...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <BackButton href="/student/dashboard" label="Dashboard" />
        </div>

        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">📝 Available Tests</h1>
          <p className="text-gray-400 mt-2">Select a test to begin</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'available', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20'
              }`}
            >
              {f === 'all' ? 'All' : f === 'available' ? 'Available' : 'Completed'}
            </button>
          ))}
        </div>

        {/* Tests Grid */}
        {tests.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12">
            <div className="text-center space-y-6">
              <div className="text-4xl mb-4">📚</div>
              {classes.length === 0 ? (
                <>
                  <p className="text-gray-400 text-lg">You haven&apos;t joined any classes yet</p>
                  <p className="text-gray-500 text-sm">Join a class using a code from your teacher to see available tests</p>
                  
                  {/* Join Class Form */}
                  <div className="max-w-md mx-auto mt-6">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="Enter class code (e.g., ABC123)"
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                      />
                      <Button
                        variant="primary"
                        onClick={handleJoinClass}
                        isLoading={joining}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-400 text-lg">No tests available yet</p>
                  <p className="text-gray-500 text-sm">Your teacher hasn&apos;t published any tests for your classes yet</p>
                  <div className="text-sm text-gray-500 mt-4">
                    <p>You&apos;re enrolled in {classes.length} class(es):</p>
                    <ul className="mt-2 space-y-1">
                      {classes.map(c => (
                        <li key={c.id} className="text-purple-400">{c.name}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 hover:border-purple-400/50 transition cursor-pointer"
                onClick={() => handleStartTest(test.id)}
              >
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">{test.title}</h3>
                  
                  {test.description && (
                    <p className="text-gray-400 text-sm">{test.description}</p>
                  )}

                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Class:</span>
                      <span className="font-medium text-white">{test.classId?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="font-medium text-white">⏱️ {test.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Marks:</span>
                      <span className="font-medium text-white">⭐ {test.totalMarks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="font-medium text-white capitalize">{test.difficulty}</span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
