'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface Stats {
  totalClasses: number;
  totalTests: number;
  totalStudents: number;
  averageScore: number;
  recentSubmissions: number;
}

interface RecentActivity {
  type: 'submission' | 'joined' | 'test';
  subject: string;
  count: string;
  time: string;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClasses: 0,
    totalTests: 0,
    totalStudents: 0,
    averageScore: 0,
    recentSubmissions: 0,
  });
  const [classes, setClasses] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Use the hydration hook
  const hasHydrated = useHasHydrated();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const notify = useNotify();

  // Fetch data when hydrated and user is available
  useEffect(() => {
    if (hasHydrated && user) {
      fetchData();
    }
  }, [hasHydrated, user]);

  // Redirect if not authenticated after hydration
  useEffect(() => {
    if (hasHydrated && !user) {
      router.push('/auth/login');
    }
  }, [hasHydrated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const classResponse = await api.get<{ classes: any[] }>('/api/classes/list');
      const classes = classResponse.classes || [];
      setClasses(classes);

      // Calculate stats
      let totalTests = 0;
      let totalStudents = new Set<string>();
      const activities: RecentActivity[] = [];

      for (const cls of classes) {
        totalTests += cls.testCount || 0;
        cls.students?.forEach((s: any) => totalStudents.add(s._id || s));

        // Add class activities
        if (cls.students?.length > 0) {
          activities.push({
            type: 'joined',
            subject: cls.name,
            count: `${cls.students.length} students`,
            time: cls.updatedAt ? new Date(cls.updatedAt).toLocaleDateString() : 'Recently'
          });
        }
      }

      // Try to get recent test results for activity
      try {
        for (const cls of classes.slice(0, 2)) {
          if (cls._id || cls.id) {
            const classId = cls._id || cls.id;
            // Just add test count info to activities
            if (cls.testCount > 0) {
              activities.push({
                type: 'test',
                subject: cls.name,
                count: `${cls.testCount} tests`,
                time: 'Active'
              });
            }
          }
        }
      } catch (e) {
        console.log('Could not fetch recent activity details');
      }

      setRecentActivity(activities.slice(0, 3));

      setStats({
        totalClasses: classes.length,
        totalTests,
        totalStudents: totalStudents.size,
        averageScore: 0,
        recentSubmissions: 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      notify.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Show loading while hydrating or no user yet
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // If hydrated but no user, show redirecting message (will redirect via useEffect)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 animate-pulse">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: '🏠', label: 'Dashboard', href: '/teacher/dashboard', active: true },
    { icon: '📚', label: 'Classes', href: '/teacher/classes' },
    { icon: '✏️', label: 'Tests', href: '/teacher/tests' },
    { icon: '📊', label: 'Analytics', href: '/teacher/analytics' },
    { icon: '📈', label: 'Reports', href: '/teacher/reports' },
    { icon: '⚙️', label: 'Settings', href: '/teacher/settings' },
  ];

  const statCards = [
    { label: 'Total Classes', value: stats.totalClasses, icon: '📚', color: 'from-blue-500 to-cyan-500', change: stats.totalClasses > 0 ? 'Active classes' : 'Create your first class' },
    { label: 'Active Tests', value: stats.totalTests, icon: '✏️', color: 'from-purple-500 to-pink-500', change: stats.totalTests > 0 ? 'Published tests' : 'Create a test' },
    { label: 'Students', value: stats.totalStudents, icon: '👥', color: 'from-green-500 to-emerald-500', change: stats.totalStudents > 0 ? 'Enrolled students' : 'Invite students' },
    { label: 'Classes Active', value: stats.totalClasses, icon: '⭐', color: 'from-yellow-500 to-orange-500', change: 'View analytics' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px]" />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile slide-in */}
      <aside
        className={`
          fixed lg:relative z-50 h-full
          bg-black/90 lg:bg-black/40 backdrop-blur-xl border-r border-white/10 text-white 
          transition-all duration-300 flex flex-col
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-72 lg:w-20' : 'w-72'}
        `}
      >
        {/* Logo */}
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <Link href="/" className={`flex items-center gap-3 ${collapsed && 'lg:hidden'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              📚
            </div>
            <span className="font-bold text-xl gradient-text">Quizzy</span>
          </Link>
          <div className="flex gap-2">
            {/* Close button on mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-white/10 rounded-xl transition lg:hidden"
            >
              ✕
            </button>
            {/* Toggle sidebar on desktop */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-white/10 rounded-xl transition hidden lg:block"
            >
              {collapsed ? '▶' : '◀'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${item.active
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <span className={`text-xl ${item.active ? '' : 'group-hover:scale-110 transition-transform'}`}>
                {item.icon}
              </span>
              <span className={`font-medium ${collapsed && 'lg:hidden'}`}>{item.label}</span>
              {item.active && (
                <div className={`ml-auto w-2 h-2 rounded-full bg-purple-400 animate-pulse ${collapsed && 'lg:hidden'}`} />
              )}
            </Link>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${collapsed && 'lg:justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shadow-lg">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className={`flex-1 min-w-0 ${collapsed && 'lg:hidden'}`}>
              <p className="font-medium text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-purple-400">Teacher</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl transition font-medium ${collapsed && 'lg:px-2'}`}
          >
            <span>🚪</span>
            <span className={`${collapsed && 'lg:hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto custom-scrollbar">
        {/* Mobile Header */}
        <div className="sticky top-0 z-30 lg:hidden bg-black/40 backdrop-blur-xl border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition text-white"
            >
              ☰
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                📚
              </div>
              <span className="font-bold text-lg gradient-text">Quizzy</span>
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xs">
              {user.firstName[0]}{user.lastName[0]}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8 gap-4 animate-fade-in">
            <div>
              <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm mb-2">
                <span>🏠</span> Dashboard
              </div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                Welcome back, <span className="gradient-text">{user.firstName}</span>! 👋
              </h1>
              <p className="text-gray-400 text-sm md:text-lg">Manage your classes and inspire your students</p>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {statCards.map((stat, i) => (
              <div
                key={i}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/10 hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Icon */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl md:text-2xl mb-3 md:mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>

                {/* Value */}
                <div className={`text-xl md:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-gray-400 font-medium text-xs md:text-sm mb-1 md:mb-2">{stat.label}</div>

                {/* Change */}
                <div className="text-xs text-green-400 items-center gap-1 hidden md:flex">
                  <span>↑</span> {stat.change}
                </div>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity blur-xl`} />
              </div>
            ))}
          </div>

          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            {/* Recent Classes - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                    📚 Recent Classes
                  </h2>
                  <p className="text-gray-400 text-xs md:text-sm mt-1">{classes.length} active classes</p>
                </div>
                <Link href="/teacher/classes">
                  <Button variant="ghost" size="sm" rightIcon={<span>→</span>}>
                    View All
                  </Button>
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8 md:py-12">
                  <div className="w-8 md:w-10 h-8 md:h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center text-3xl md:text-4xl mb-4">
                    📚
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No classes yet</h3>
                  <p className="text-gray-400 mb-4 md:mb-6 text-sm">Create your first class to get started</p>
                  <Button variant="primary" onClick={() => router.push('/teacher/classes')}>
                    Create Your First Class
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                  {classes.slice(0, 4).map((cls, i) => (
                    <div
                      key={cls._id || cls.id}
                      className="group p-3 md:p-4 bg-white/5 border border-white/10 rounded-lg md:rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-200 cursor-pointer"
                      onClick={() => router.push(`/teacher/classes/${cls._id || cls.id}`)}
                    >
                      <div className="flex items-start gap-2 md:gap-3">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                          📖
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm md:text-base group-hover:text-purple-300 transition-colors truncate">
                            {cls.name}
                          </h4>
                          <p className="text-gray-500 text-xs md:text-sm truncate">{cls.description || 'No description'}</p>
                          <div className="flex items-center gap-2 md:gap-3 text-xs text-gray-400 mt-1 md:mt-2">
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
            <div className="space-y-4 md:space-y-6">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">⚡ Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {[
                    { icon: '📚', label: 'New Class', href: '/teacher/classes' },
                    { icon: '✏️', label: 'Create Test', href: '/teacher/classes' },
                    { icon: '👥', label: 'Students', href: '/teacher/classes' },
                    { icon: '📊', label: 'Analytics', href: '/teacher/analytics' },
                  ].map((action, i) => (
                    <Link
                      key={i}
                      href={action.href}
                      className="flex flex-col items-center gap-1 md:gap-2 p-3 md:p-4 bg-white/5 border border-white/10 rounded-lg md:rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                    >
                      <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                      <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{action.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-lg font-bold text-white mb-4">📈 Recent Activity</h3>
                <div className="space-y-2 md:space-y-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-6 md:py-8">
                      <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  ) : recentActivity.length === 0 ? (
                    <div className="text-center py-4 md:py-6">
                      <p className="text-gray-400 text-xs md:text-sm">No recent activity</p>
                      <p className="text-gray-500 text-xs mt-1">Create a class to get started</p>
                    </div>
                  ) : (
                    recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-white/5 rounded-lg md:rounded-xl">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs md:text-sm flex-shrink-0">
                          {activity.type === 'submission' ? '📝' : activity.type === 'joined' ? '👥' : '✓'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm text-white truncate">{activity.subject}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                        <span className="text-xs md:text-sm font-bold text-purple-400 whitespace-nowrap">{activity.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
