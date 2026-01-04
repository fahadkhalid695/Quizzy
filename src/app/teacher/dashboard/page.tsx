'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Sidebar */}
      <div
        className={`${
          collapsed ? 'w-20' : 'w-64'
        } bg-white/10 backdrop-blur-md border-r border-white/20 transition-all duration-300 p-4 space-y-6 sticky top-0 h-screen overflow-y-auto`}
      >
        {/* Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/20 rounded-lg transition w-full text-center text-white"
        >
          {collapsed ? '→' : '←'}
        </button>

        {/* Logo */}
        {!collapsed && (
          <div className="text-center">
            <div className="text-4xl mb-2">✨</div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">QuizMaster</h1>
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
        <div className="pt-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className={`w-full p-3 rounded-xl text-red-400 hover:bg-red-500/20 transition font-medium ${
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-gray-400 text-lg">Manage your classes and tests</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => router.push('/teacher/classes')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              + New Class
            </Button>
          </div>

          {/* Teacher Profile Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-gray-500 text-sm mt-1">Role: <span className="text-purple-400 font-semibold">Teacher</span></p>
            </div>
          </div>

          {/* Stats Cards */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon="📚" title="Classes" value={stats.totalClasses} />
              <StatCard icon="✏️" title="Tests" value={stats.totalTests} />
              <StatCard icon="👥" title="Students" value={stats.totalStudents} />
              <StatCard icon="⭐" title="Avg Score" value={`${stats.averageScore}%`} />
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
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
          </div>

          {/* Recent Classes */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Recent Classes</h3>
            <p className="text-gray-400 text-sm mb-6">Your active classes ({classes.length})</p>
            {loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : classes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No classes yet</p>
                <Button variant="primary" onClick={() => router.push('/teacher/classes')}>
                  Create Your First Class
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.slice(0, 6).map((cls) => (
                  <div
                    key={cls._id || cls.id}
                    className="p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:border-purple-400/50 transition cursor-pointer"
                    onClick={() => router.push(`/teacher/classes/${cls._id || cls.id}`)}
                  >
                    <h3 className="font-bold text-white">{cls.name}</h3>
                    <div className="text-sm text-gray-400 mt-1">{cls.description}</div>
                    <div className="flex gap-4 mt-3 text-xs text-gray-400">
                      <span>👥 {cls.students?.length || 0} students</span>
                      <span>📝 {cls.testCount || 0} tests</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
      className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/20 text-gray-300 hover:text-white transition ${
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
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
          <p className={`text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent`}>
            {value}
          </p>
        </div>
        <span className="text-5xl opacity-50">{icon}</span>
      </div>
    </div>
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
      className="p-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-purple-400/50 transition space-y-2 group"
    >
      <div className="text-3xl group-hover:scale-110 transition transform">{icon}</div>
      <div className="text-sm font-medium text-white group-hover:text-purple-300 transition">{label}</div>
    </button>
  );
}
