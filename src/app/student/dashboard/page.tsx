'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function StudentDashboard() {
  const router = useRouter()
  const { user, logout, _hasHydrated: hasHydrated } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Redirect if not authenticated after hydration
  useEffect(() => {
    if (isMounted && hasHydrated && !user) {
      router.push('/auth/login')
    }
  }, [isMounted, hasHydrated, user, router])

  // Show loading while hydrating
  if (!isMounted || !hasHydrated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const navItems = [
    { icon: '🏠', label: 'Dashboard', href: '/student/dashboard', active: true },
    { icon: '📝', label: 'Available Tests', href: '/student/tests' },
    { icon: '📈', label: 'My Results', href: '/student/results' },
    { icon: '🏆', label: 'Leaderboard', href: '/student/leaderboard' },
    { icon: '⚙️', label: 'Settings', href: '/student/settings' },
  ]

  const stats = [
    { label: 'Tests Taken', value: '12', icon: '📝', color: 'from-blue-500 to-cyan-500', change: '+3 this week' },
    { label: 'Average Score', value: '85%', icon: '📊', color: 'from-purple-500 to-pink-500', change: '+5% improvement' },
    { label: 'Best Score', value: '98%', icon: '⭐', color: 'from-yellow-500 to-orange-500', change: 'Personal best!' },
    { label: 'Current Rank', value: '#8', icon: '🏆', color: 'from-green-500 to-emerald-500', change: 'Top 10%' },
  ]

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
          sidebarOpen ? 'w-72' : 'w-20'
        } relative z-10 bg-black/40 backdrop-blur-xl border-r border-white/10 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 flex justify-between items-center border-b border-white/10">
          <Link href="/" className={`flex items-center gap-3 ${!sidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              📚
            </div>
            <span className="font-bold text-xl gradient-text">QuizMaster</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-xl transition"
          >
            {sidebarOpen ? '◀' : '▶'}
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
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
              {item.active && sidebarOpen && (
                <div className="ml-auto w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              )}
            </Link>
          ))}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/10">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/5 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shadow-lg">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl transition font-medium ${!sidebarOpen && 'px-2'}`}
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-8 max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <span>🏠</span> Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Welcome back, <span className="gradient-text">{user.firstName}</span>! 👋
            </h1>
            <p className="text-gray-400 text-lg">Ready to ace some quizzes today?</p>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, i) => (
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
            {/* Available Tests - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    📝 Available Tests
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Tests waiting for you to complete</p>
                </div>
                <Link href="/student/tests">
                  <Button variant="ghost" size="sm" rightIcon={<span>→</span>}>
                    View All
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {[
                  { title: 'Mathematics - Algebra Basics', duration: 45, questions: 15, difficulty: 'Easy', color: 'green' },
                  { title: 'Physics - Motion & Forces', duration: 60, questions: 20, difficulty: 'Medium', color: 'yellow' },
                  { title: 'Chemistry - Periodic Table', duration: 30, questions: 10, difficulty: 'Hard', color: 'red' },
                ].map((test, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-500/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-2xl">
                        📄
                      </div>
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {test.title}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                          <span>⏱️ {test.duration} min</span>
                          <span>•</span>
                          <span>❓ {test.questions} questions</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            test.color === 'green' ? 'bg-green-500/20 text-green-400' :
                            test.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {test.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button variant="primary" size="sm">
                      Start →
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions + Recent Activity */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                <h3 className="text-lg font-bold text-white mb-4">⚡ Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: '📝', label: 'Take Test', href: '/student/tests' },
                    { icon: '📈', label: 'My Results', href: '/student/results' },
                    { icon: '🏆', label: 'Leaderboard', href: '/student/leaderboard' },
                    { icon: '⚙️', label: 'Settings', href: '/student/settings' },
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
                <h3 className="text-lg font-bold text-white mb-4">📊 Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: 'Completed test', subject: 'Math Quiz', score: '92%', time: '2h ago' },
                    { action: 'Achieved rank', subject: '#5 in Physics', score: null, time: '1d ago' },
                    { action: 'Completed test', subject: 'Chemistry', score: '88%', time: '2d ago' },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm">
                        {activity.score ? '✓' : '🏆'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{activity.subject}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                      {activity.score && (
                        <span className="text-sm font-bold text-green-400">{activity.score}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
