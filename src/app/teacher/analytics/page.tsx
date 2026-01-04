'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import BackButton from '@/components/common/BackButton';

interface ClassData {
  _id: string;
  name: string;
  description: string;
  students: string[];
  testCount: number;
}

export default function AnalyticsPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const notify = useNotify();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ classes: ClassData[] }>('/api/classes/list');
      setClasses(response.classes || []);
    } catch (error) {
      notify.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (classId: string) => {
    try {
      const response = await api.get<any>(`/api/reports/class/${classId}`);
      setAnalytics(response);
    } catch (error) {
      notify.error('Failed to load analytics');
    }
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    fetchAnalytics(classId);
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
        
        <div>
          <h1 className="text-4xl font-bold text-white">📊 Analytics & Reports</h1>
          <p className="text-gray-400 mt-2">View performance metrics for your classes</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : classes.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">No Classes Yet</h3>
            <p className="text-gray-400 mb-6">Create a class to see analytics</p>
            <Button variant="primary" onClick={() => router.push('/teacher/classes')}>
              Create Your First Class
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Classes List */}
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
                <h3 className="text-lg font-bold text-white mb-4">Select Class</h3>
                <div className="space-y-2">
                  {classes.map((cls) => (
                    <button
                      key={cls._id}
                      onClick={() => handleClassSelect(cls._id)}
                      className={`w-full text-left p-3 rounded-lg transition ${
                        selectedClass === cls._id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium">{cls.name}</div>
                      <div className="text-sm opacity-70">
                        {cls.students?.length || 0} students • {cls.testCount || 0} tests
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analytics Display */}
            <div className="lg:col-span-3">
              {!selectedClass ? (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <p className="text-gray-400">Select a class to view analytics</p>
                </div>
              ) : analytics ? (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <StatCard 
                      icon="👥" 
                      title="Students" 
                      value={analytics.totalStudents || 0} 
                    />
                    <StatCard 
                      icon="📝" 
                      title="Tests" 
                      value={analytics.totalTests || 0} 
                    />
                    <StatCard 
                      icon="✅" 
                      title="Submissions" 
                      value={analytics.totalSubmissions || 0} 
                    />
                    <StatCard 
                      icon="📈" 
                      title="Avg Score" 
                      value={`${analytics.averageScore?.toFixed(1) || 0}%`} 
                    />
                  </div>

                  {/* Performance Distribution */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Performance Distribution</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <PerformanceBar label="Excellent (90%+)" percentage={analytics.excellentPercentage || 0} color="from-green-500 to-emerald-500" />
                      <PerformanceBar label="Good (70-89%)" percentage={analytics.goodPercentage || 0} color="from-blue-500 to-cyan-500" />
                      <PerformanceBar label="Average (50-69%)" percentage={analytics.averagePercentage || 0} color="from-yellow-500 to-orange-500" />
                      <PerformanceBar label="Needs Work (<50%)" percentage={analytics.needsWorkPercentage || 0} color="from-red-500 to-pink-500" />
                    </div>
                  </div>

                  {/* Top Performers */}
                  {analytics.topPerformers && analytics.topPerformers.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">🏆 Top Performers</h3>
                      <div className="space-y-3">
                        {analytics.topPerformers.map((student: any, index: number) => (
                          <div 
                            key={student.id || index}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '⭐'}
                              </span>
                              <span className="text-white font-medium">{student.name}</span>
                            </div>
                            <span className="text-purple-400 font-bold">{student.averageScore?.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
                  <div className="text-gray-400">Loading analytics...</div>
                </div>
              )}
            </div>
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

function PerformanceBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div className="text-center">
      <div className="h-32 bg-white/5 rounded-lg relative overflow-hidden mb-2">
        <div 
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${color} transition-all duration-500`}
          style={{ height: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold text-white">{percentage.toFixed(0)}%</p>
    </div>
  );
}
