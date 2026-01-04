'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Button from '@/components/ui/Button'

export default function StudentDashboard() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  if (!isMounted || !user) {
    return <div className="min-h-screen bg-slate-900" />
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white/10 backdrop-blur-md border-r border-white/20 text-white transition-all duration-300 flex flex-col sticky top-0`}
      >
        <div className="p-4 flex justify-between items-center border-b border-white/20">
          <h1 className={`font-bold text-xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent ${!sidebarOpen && 'hidden'}`}>
            ✨ QuizMaster
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="mt-4 space-y-2 px-2 flex-1">
          {[
            { icon: '🏠', label: 'Dashboard', href: '/student/dashboard' },
            { icon: '📝', label: 'Available Tests', href: '/student/tests' },
            { icon: '📈', label: 'My Results', href: '/student/results' },
            { icon: '🏆', label: 'Leaderboard', href: '/student/leaderboard' },
            { icon: '⚙️', label: 'Settings', href: '/student/settings' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/20 text-gray-200 hover:text-white transition"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-white/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/80 hover:bg-red-600 rounded-xl transition font-medium"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-gray-400 text-lg">Ready to take some quizzes?</p>
          </div>

          {/* User Info Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-2xl font-bold text-white">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-400">{user.email}</p>
              <p className="text-gray-500 text-sm mt-1">Role: <span className="text-purple-400 font-semibold">Student</span></p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Tests Taken', value: '12', icon: '📝', color: 'from-blue-400' },
              { label: 'Average Score', value: '85%', icon: '📊', color: 'from-purple-400' },
              { label: 'Best Score', value: '98%', icon: '⭐', color: 'from-yellow-400' },
              { label: 'Current Rank', value: '#8', icon: '🏆', color: 'from-green-400' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium mb-2">{stat.label}</p>
                    <p className={`text-4xl font-bold bg-gradient-to-r ${stat.color} to-pink-400 bg-clip-text text-transparent`}>
                      {stat.value}
                    </p>
                  </div>
                  <span className="text-5xl opacity-50">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Available Tests Section */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">📝 Available Tests</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition group"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-lg group-hover:text-purple-300 transition">
                      Mathematics Chapter {i}
                    </h4>
                    <p className="text-gray-400 text-sm mt-1">
                      ⏱️ {45 + i * 15} min • ❓ {10 + i * 5} questions • 📊 {85 - i * 5}% avg
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Start →
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Results */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-2">📈 Recent Results</h2>
            <p className="text-gray-400 mb-4">Your latest test performance</p>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition"
                >
                  <div>
                    <h4 className="font-bold text-white">Test {i} - {85 - i * 5}%</h4>
                    <p className="text-gray-400 text-sm mt-1">
                      ✓ {8 + i} / {10} correct • Taken on Dec {25 - i}, 2024
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30">
                    View →
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
