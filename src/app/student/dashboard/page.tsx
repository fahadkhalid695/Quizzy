'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useHasHydrated } from '@/lib/store';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import ClassInvitations from '@/components/student/ClassInvitations';
import { api } from '@/lib/api-client';

interface DashboardStats {
  testsTaken: number;
  averageScore: number;
  bestScore: number;
  totalTests: number;
}

interface AvailableTest {
  id: string;
  title: string;
  duration: number;
  difficulty: string;
  totalMarks: number;
  questionCount: number;
  className?: string;
}

interface RecentResult {
  id: string;
  testTitle: string;
  score: number;
  percentage: number;
  submittedAt: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'invitations'>('overview');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    testsTaken: 0,
    averageScore: 0,
    bestScore: 0,
    totalTests: 0
  });
  const [availableTests, setAvailableTests] = useState<AvailableTest[]>([]);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);

  // Fetch all dashboard data
  useEffect(() => {
    if (hasHydrated && user) {
      fetchDashboardData();
      fetchInvitationCount();
    }
  }, [hasHydrated, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch available tests and results in parallel
      const [testsResponse, resultsResponse] = await Promise.all([
        api.get<{ tests: any[] }>('/api/tests/available'),
        api.get<{ results: any[] }>('/api/results/list')
      ]);

      const tests = testsResponse.tests || [];
      const results = resultsResponse.results || [];

      // Process available tests - filter out already submitted tests
      const unsubmittedTests = tests.filter((test: any) => !test.isSubmitted);
      setAvailableTests(unsubmittedTests.slice(0, 3).map((test: any) => ({
        id: test.id,
        title: test.title,
        duration: test.duration,
        difficulty: test.difficulty,
        totalMarks: test.totalMarks,
        questionCount: test.questionCount || test.questions?.length || 0,
        className: test.classId?.name || test.className
      })));

      // Process results for stats
      const testsTaken = results.length;
      const totalScore = results.reduce((sum: number, r: any) => sum + (r.percentage || 0), 0);
      const averageScore = testsTaken > 0 ? Math.round(totalScore / testsTaken) : 0;
      const bestScore = testsTaken > 0 ? Math.max(...results.map((r: any) => r.percentage || 0)) : 0;

      setStats({
        testsTaken,
        averageScore,
        bestScore,
        totalTests: unsubmittedTests.length  // Show only unsubmitted tests count
      });

      // Recent results
      setRecentResults(results.slice(0, 3).map((result: any) => ({
        id: result.id,
        testTitle: result.testId?.title || 'Unknown Test',
        score: result.score || 0,
        percentage: result.percentage || 0,
        submittedAt: result.submittedAt
      })));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitationCount = async () => {
    try {
      const response = await api.get<{ invitations: any[] }>('/api/invitations/student?status=pending');
      setPendingInvitations(response.invitations?.length || 0);
    } catch (error) {
      console.error('Failed to fetch invitation count:', error);
    }
  };

  // Redirect if not authenticated after hydration
  useEffect(() => {
    if (hasHydrated && !user) {
      router.push('/auth/login');
    }
  }, [hasHydrated, user, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { icon: '🏠', label: 'Dashboard', href: '/student/dashboard', active: true },
    { icon: '📨', label: 'Invitations', href: '#', badge: pendingInvitations, onClick: () => setActiveTab('invitations') },
    { icon: '📝', label: 'Available Tests', href: '/student/tests' },
    { icon: '📈', label: 'My Results', href: '/student/results' },
    { icon: '🏆', label: 'Leaderboard', href: '/student/leaderboard' },
    { icon: '⚙️', label: 'Settings', href: '/student/settings' },
  ];

  const statCards = [
    { label: 'Tests Taken', value: stats.testsTaken.toString(), icon: '📝', color: 'from-blue-500 to-cyan-500', change: `${stats.totalTests} available` },
    { label: 'Average Score', value: `${stats.averageScore}%`, icon: '📊', color: 'from-purple-500 to-pink-500', change: stats.averageScore >= 70 ? 'Great work!' : 'Keep practicing' },
    { label: 'Best Score', value: `${stats.bestScore}%`, icon: '⭐', color: 'from-yellow-500 to-orange-500', change: stats.bestScore >= 90 ? 'Excellent!' : 'Personal best' },
    { label: 'Tests Available', value: stats.totalTests.toString(), icon: '🏆', color: 'from-green-500 to-emerald-500', change: 'Ready to take' },
  ];

  // Show loading while hydrating
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

  // If hydrated but no user, show redirecting message
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
          ${sidebarOpen ? 'w-72' : 'w-72 lg:w-20'}
        `}
      >
        {/* Logo */}
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <Link href="/" className={`flex items-center gap-3 ${!sidebarOpen && 'lg:hidden'}`}>
            <div className="w-10 h-10 relative">
              <Image
                src="/images/quizzy-logo.svg"
                alt="Quizzy Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
                unoptimized
              />
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-xl transition hidden lg:block"
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.active || (item.label === 'Invitations' && activeTab === 'invitations')
            const Component = item.onClick ? 'button' : Link
            const props = item.onClick
              ? { onClick: () => { item.onClick(); setMobileMenuOpen(false); }, className: 'w-full' }
              : { href: item.href, onClick: () => setMobileMenuOpen(false) }

            return (
              <Component
                key={item.label}
                {...props as any}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full ${isActive
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className={`text-xl ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`}>
                  {item.icon}
                </span>
                <span className={`font-medium ${!sidebarOpen && 'lg:hidden'}`}>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className={`ml-auto px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full animate-pulse ${!sidebarOpen && 'lg:hidden'}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && !item.badge && (
                  <div className={`ml-auto w-2 h-2 rounded-full bg-purple-400 animate-pulse ${!sidebarOpen && 'lg:hidden'}`} />
                )}
              </Component>
            )
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${!sidebarOpen && 'lg:justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shadow-lg">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className={`flex-1 min-w-0 ${!sidebarOpen && 'lg:hidden'}`}>
              <p className="font-medium text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl transition font-medium ${!sidebarOpen && 'lg:px-2'}`}
          >
            <span>🚪</span>
            <span className={`${!sidebarOpen && 'lg:hidden'}`}>Logout</span>
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
              <div className="w-8 h-8 relative">
                <Image
                  src="/images/quizzy-logo.svg"
                  alt="Quizzy Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                  unoptimized
                />
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
          <div className="mb-6 md:mb-8 animate-fade-in">
            <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm mb-2">
              <span>🏠</span> Dashboard
              {activeTab === 'invitations' && (
                <>
                  <span>/</span>
                  <span>📨 Invitations</span>
                </>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                  {activeTab === 'overview' ? (
                    <>Welcome back, <span className="gradient-text">{user.firstName}</span>! 👋</>
                  ) : (
                    <>Class Invitations 📨</>
                  )}
                </h1>
                <p className="text-gray-400 text-sm md:text-lg">
                  {activeTab === 'overview' ? 'Ready to ace some quizzes today?' : 'Manage your class invitations and join new classes'}
                </p>
              </div>
              {activeTab === 'invitations' && (
                <button
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 text-sm self-start"
                >
                  ← Back to Dashboard
                </button>
              )}
            </div>
          </div>

          {activeTab === 'invitations' ? (
            <ClassInvitations />
          ) : (
            <>
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
                      {loading ? '...' : stat.value}
                    </div>

                    {/* Label */}
                    <div className="text-gray-400 font-medium text-xs md:text-sm mb-1 md:mb-2">{stat.label}</div>

                    {/* Change */}
                    <div className="text-xs text-green-400 flex items-center gap-1 hidden md:flex">
                      <span>📊</span> {stat.change}
                    </div>

                    {/* Hover glow */}
                    <div className={`absolute inset-0 rounded-xl md:rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity blur-xl`} />
                  </div>
                ))}
              </div>

              {/* Two Column Layout */}
              <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                {/* Available Tests - Takes 2 columns */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                        📝 Available Tests
                      </h2>
                      <p className="text-gray-400 text-xs md:text-sm mt-1">Tests waiting for you</p>
                    </div>
                    <Link href="/student/tests">
                      <Button variant="ghost" size="sm" rightIcon={<span>→</span>}>
                        View All
                      </Button>
                    </Link>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8 md:py-12">
                      <div className="w-8 md:w-10 h-8 md:h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  ) : availableTests.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center text-3xl md:text-4xl mb-4">
                        📝
                      </div>
                      <h3 className="text-lg md:text-xl font-semibold text-white mb-2">No tests available</h3>
                      <p className="text-gray-400 mb-4 md:mb-6 text-sm">Join a class to see available tests</p>
                      <Button variant="primary" onClick={() => setActiveTab('invitations')}>
                        View Invitations
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableTests.map((test, i) => {
                        const difficultyColor = test.difficulty === 'easy' ? 'green' : test.difficulty === 'medium' ? 'yellow' : 'red'
                        return (
                          <div
                            key={test.id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-xl md:text-2xl flex-shrink-0">
                                📄
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors text-sm md:text-base truncate">
                                  {test.title}
                                </h4>
                                <div className="flex items-center flex-wrap gap-2 md:gap-3 text-xs md:text-sm text-gray-400 mt-1">
                                  <span>⏱️ {test.duration}m</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span>📊 {test.totalMarks} marks</span>
                                  <span className="hidden sm:inline">•</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor === 'green' ? 'bg-green-500/20 text-green-400' :
                                    difficultyColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-red-500/20 text-red-400'
                                    }`}>
                                    {test.difficulty}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button variant="primary" size="sm" onClick={() => router.push(`/student/test/${test.id}`)} className="self-end sm:self-center">
                              Start →
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Actions + Recent Activity */}
                <div className="space-y-4 md:space-y-6">
                  {/* Quick Actions */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                    <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">⚡ Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      {[
                        { icon: '📝', label: 'Take Test', href: '/student/tests' },
                        { icon: '📈', label: 'My Results', href: '/student/results' },
                        { icon: '🏆', label: 'Leaderboard', href: '/student/leaderboard' },
                        { icon: '⚙️', label: 'Settings', href: '/student/settings' },
                      ].map((action, i) => (
                        <Link
                          key={i}
                          href={action.href}
                          className="flex flex-col items-center gap-1 md:gap-2 p-3 md:p-4 bg-white/5 border border-white/10 rounded-lg md:rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all group"
                        >
                          <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                          <span className="text-xs md:text-sm text-gray-400 group-hover:text-white transition-colors">{action.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl md:rounded-2xl p-4 md:p-6 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                    <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">📊 Recent Results</h3>
                    <div className="space-y-2 md:space-y-3">
                      {loading ? (
                        <div className="flex items-center justify-center py-6 md:py-8">
                          <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        </div>
                      ) : recentResults.length === 0 ? (
                        <div className="text-center py-4 md:py-6">
                          <p className="text-gray-400 text-xs md:text-sm">No results yet</p>
                          <p className="text-gray-500 text-xs mt-1">Complete a test to see your results</p>
                        </div>
                      ) : (
                        recentResults.map((result, i) => (
                          <div key={result.id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-white/5 rounded-lg md:rounded-xl">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs md:text-sm flex-shrink-0">
                              {result.percentage >= 70 ? '✓' : '📝'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm text-white truncate">{result.testTitle}</p>
                              <p className="text-xs text-gray-500">
                                {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : 'Recently'}
                              </p>
                            </div>
                            <span className={`text-xs md:text-sm font-bold ${result.percentage >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                              {result.percentage}%
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
