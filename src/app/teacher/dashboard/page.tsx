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
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const notify = useNotify();

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && hasHydrated) {
      fetchData();
    }
  }, [isMounted, hasHydrated]);

  // Redirect if not authenticated after hydration
  useEffect(() => {
    if (isMounted && hasHydrated && !user) {
      router.push('/auth/login');
    }
  }, [isMounted, hasHydrated, user, router]);

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

  // Show loading while hydrating
  if (!isMounted || !hasHydrated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: '🏠', label: 'Dashboard', href: '/teacher/dashboard', active: true },
    { icon: '📚', label: 'Classes', href: '/teacher/classes' },
    { icon: '✏️', label: 'Tests', href: '/teacher/tests' },
    { icon: '📊', label: 'Analytics', href: '/teacher/analytics' },
    { icon: '⚙️', label: 'Settings', href: '/teacher/settings' },
  ];

  const statCards = [
    { label: 'Total Classes', value: stats.totalClasses, icon: '📚', color: 'from-blue-500 to-cyan-500', change: '+2 this month' },
    { label: 'Active Tests', value: stats.totalTests, icon: '✏️', color: 'from-purple-500 to-pink-500', change: '3 pending' },
    { label: 'Students', value: stats.totalStudents, icon: '👥', color: 'from-green-500 to-emerald-500', change: '+12 new' },
    { label: 'Avg Score', value: `${stats.averageScore}%`, icon: '⭐', color: 'from-yellow-500 to-orange-500', change: '+5% this week' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px]" />
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-72'
        } relative z-10 bg-black/40 backdrop-blur-xl border-r border-white/10 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <Link href="/" className={`flex items-center gap-3 ${collapsed && 'hidden'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              📚
            </div>
            <span className="font-bold text-xl gradient-text">QuizMaster</span>
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-white/10 rounded-xl transition"
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                item.active
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`text-xl ${item.active ? '' : 'group-hover:scale-110 transition-transform'}`}>
                {item.icon}
              </span>
              {!collapsed && <span className="font-medium">{item.label}</span>}
              {item.active && !collapsed && (
                <div className="ml-auto w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${collapsed && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shadow-lg">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-purple-400">Teacher</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl transition font-medium ${collapsed && 'px-2'}`}
          >
            <span>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-8 max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <span>🏠</span> Dashboard
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Welcome back, <span className="gradient-text">{user.firstName}</span>! 👋
              </h1>
              <p className="text-gray-400 text-lg">Manage your classes and inspire your students</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => router.push('/teacher/classes')}
              leftIcon={<span>+</span>}
            >
              New Class
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat, i) => (
              <div
                key={i}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>

                {/* Value */}
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-gray-400 font-medium mb-2">{stat.label}</div>

                {/* Change */}
                <div className="text-xs text-green-400 flex items-center gap-1">
                  <span>↑</span> {stat.change}
                </div>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity blur-xl`} />
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent Classes - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    📚 Recent Classes
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">{classes.length} active classes</p>
                </div>
                <Link href="/teacher/classes">
                  <Button variant="ghost" size="sm" rightIcon={<span>→</span>}>
                    View All
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center text-4xl mb-4">
                    📚
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No classes yet</h3>
                  <p className="text-gray-400 mb-6">Create your first class to get started</p>
                  <Button variant="primary" onClick={() => router.push('/teacher/classes')}>
                    Create Your First Class
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {classes.slice(0, 4).map((cls, i) => (
                    <div
                      key={cls._id || cls.id}
                      className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-200 cursor-pointer"
                      onClick={() => router.push(`/teacher/classes/${cls._id || cls.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                          📖
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                            {cls.name}
                          </h4>
                          <p className="text-gray-500 text-sm truncate">{cls.description || 'No description'}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                            <span className="flex items-center gap-1">
                              <span>👥</span> {cls.students?.length || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>📝</span> {cls.testCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <h3 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '📚', label: 'New Class', href: '/teacher/classes' },
                    { icon: '✏️', label: 'Create Test', href: '/teacher/classes' },
                    { icon: '👥', label: 'Students', href: '/teacher/classes' },
                    { icon: '📊', label: 'Analytics', href: '/teacher/analytics' },
                  ].map((action, i) => (
                    <Link
                      key={i}
                      href={action.href}
                      className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                      <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-lg font-bold text-white mb-4">📈 Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: 'New submission', subject: 'Math Quiz', count: '15', time: '2h ago' },
                    { action: 'Class joined', subject: 'Physics 101', count: '+3', time: '5h ago' },
                    { action: 'Test completed', subject: 'Chemistry', count: '25', time: '1d ago' },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm">
                        {activity.action.includes('submission') ? '📝' : activity.action.includes('joined') ? '👥' : '✓'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{activity.subject}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      <span className="text-sm font-bold text-purple-400">{activity.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
