'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
const { Header: CardHeader, Body: CardBody } = Card

export default function StudentDashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-primary text-white transition-all duration-300`}>
        <div className="p-4 flex justify-between items-center">
          <h1 className={`font-bold text-xl ${!sidebarOpen && 'hidden'}`}>📚 QuizApp</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="mt-8 space-y-2 px-2">
          {[
            { icon: '📊', label: 'Dashboard', href: '/student/dashboard' },
            { icon: '📝', label: 'Available Tests', href: '/student/tests' },
            { icon: '📈', label: 'My Results', href: '/student/results' },
            { icon: '🏆', label: 'Leaderboard', href: '/student/leaderboard' },
            { icon: '⚙️', label: 'Settings', href: '/student/settings' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/10 transition"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-4 left-2 right-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Welcome, Student! 👨‍🎓
          </h1>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Tests Taken', value: '8', icon: '📝' },
              { label: 'Average Score', value: '82%', icon: '📊' },
              { label: 'Best Score', value: '95%', icon: '🌟' },
              { label: 'Rank', value: '#5', icon: '🏆' },
            ].map((stat) => (
              <Card key={stat.label}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <span className="text-4xl">{stat.icon}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Available Tests */}
          <Card className="mb-8">
            <CardHeader title="Available Tests" />
            <CardBody>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Test: Subject Chapter {i}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Duration: {45 + i * 15} minutes • {10 + i * 5} questions
                      </p>
                    </div>
                    <Button variant="primary" size="sm">
                      Start Test
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Recent Results */}
          <Card>
            <CardHeader title="Recent Results" subtitle="Your latest test performance" />
            <CardBody>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Test {i} - {85 - i * 5}%
                      </h4>
                      <p className="text-sm text-gray-600">
                        Taken on Dec {25 - i}, 2024
                      </p>
                    </div>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
