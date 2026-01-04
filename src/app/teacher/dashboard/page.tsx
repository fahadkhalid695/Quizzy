'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';

interface Stats {
  totalClasses: number;
  totalTests: number;
  totalStudents: number;
  averageScore: number;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClasses: 0,
    totalTests: 0,
    totalStudents: 0,
    averageScore: 0,
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const notify = useNotify();


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const classResponse = await api.get<{ classes: any[] }>('/api/classes/list');
      const classes = classResponse.classes || [];
      setClasses(classes);

      // Calculate stats
      let totalTests = 0;
      let totalStudents = new Set<string>();

      for (const cls of classes) {
        totalTests += cls.testCount || 0;
        cls.students?.forEach((s: any) => totalStudents.add(s._id));
      }

      setStats({
        totalClasses: classes.length,
        totalTests,
        totalStudents: totalStudents.size,
        averageScore: 0,
      });
    } catch (error) {
      notify.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex">
      {/* Sidebar */}
      <div
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-gray-200 shadow-lg transition-all duration-300 p-4 space-y-6`}
      >
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition w-full text-center"
        >
          {collapsed ? '→' : '←'}
        </button>

        {/* Logo */}
        {!collapsed && (
          <div className="text-center">
            <div className="text-3xl mb-2">📚</div>
            <h1 className="font-bold text-lg text-gray-900">QuizApp</h1>
          </div>
        )}

        {/* Menu */}
        <nav className="space-y-2">
          <NavLink href="/teacher/dashboard" icon="🏠" label="Dashboard" collapsed={collapsed} />
          <NavLink href="/teacher/classes" icon="📚" label="Classes" collapsed={collapsed} />
          <NavLink href="/teacher/tests" icon="✏️" label="Tests" collapsed={collapsed} />
          <NavLink href="/teacher/analytics" icon="📊" label="Analytics" collapsed={collapsed} />
          <NavLink href="/teacher/settings" icon="⚙️" label="Settings" collapsed={collapsed} />
        </nav>

        {/* Logout */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className={`w-full p-3 rounded-lg text-red-600 hover:bg-red-50 transition font-medium ${
              collapsed ? 'text-center' : 'text-left'
            }`}
          >
            {collapsed ? '🚪' : '🚪 Logout'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-gray-600 mt-1">Manage your classes and tests</p>
            </div>
            <Button variant="primary" onClick={() => router.push('/teacher/classes')}>
              + Create Class
            </Button>
          </div>

          {/* Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon="📚" title="Classes" value={stats.totalClasses} />
              <StatCard icon="✏️" title="Tests" value={stats.totalTests} />
              <StatCard icon="👥" title="Students" value={stats.totalStudents} />
              <StatCard icon="⭐" title="Avg Score" value={`${stats.averageScore}%`} />
            </div>
          )}

          {/* Quick Actions */}
          <Card>
            <Card.Header title="Quick Actions" />
            <Card.Body>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <ActionButton
                  icon="📚"
                  label="New Class"
                  onClick={() => router.push('/teacher/classes')}
                />
                <ActionButton
                  icon="✏️"
                  label="Create Test"
                  onClick={() => router.push('/teacher/classes')}
                />
                <ActionButton
                  icon="👥"
                  label="Manage Students"
                  onClick={() => router.push('/teacher/classes')}
                />
                <ActionButton
                  icon="📊"
                  label="View Reports"
                  onClick={() => router.push('/teacher/analytics')}
                />
              </div>
            </Card.Body>
          </Card>

          {/* Recent Classes */}
          <Card>
            <Card.Header
              title={`Recent Classes (${classes.length})`}
              subtitle="Your active classes"
            />
            <Card.Body>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : classes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No classes yet</p>
                  <Button variant="primary" onClick={() => router.push('/teacher/classes')}>
                    Create Your First Class
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.slice(0, 6).map((cls) => (
                    <div
                      key={cls._id || cls.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:shadow-md transition cursor-pointer"
                      onClick={() => router.push(`/teacher/classes/${cls._id || cls.id}`)}
                    >
                      <h3 className="font-bold text-gray-900">{cls.name}</h3>
                      <div className="text-sm text-gray-600 mt-1">{cls.description}</div>
                      <div className="flex gap-4 mt-3 text-xs text-gray-500">
                        <span>👥 {cls.students?.length || 0} students</span>
                        <span>📝 {cls.testCount || 0} tests</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  collapsed,
}: {
  href: string;
  icon: string;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-50 text-gray-700 transition ${
        collapsed ? 'justify-center' : ''
      }`}
    >
      <span className="text-xl">{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </Link>
  );
}

function StatCard({ icon, title, value }: { icon: string; title: string; value: number | string }) {
  return (
    <Card>
      <Card.Body className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </Card.Body>
    </Card>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition space-y-2"
    >
      <div className="text-2xl">{icon}</div>
      <div className="text-sm font-medium text-gray-900">{label}</div>
    </button>
  );
}
