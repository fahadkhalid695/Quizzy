'use client'

import React from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">📚 QuizApp</h1>
          <div className="space-x-4">
            <Link href="/auth/login">
              <Button variant="secondary" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="primary" size="sm">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-20">
        <div className="text-center text-white mb-20">
          <h2 className="text-5xl font-bold mb-6">
            Dynamic Quiz Management System
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Empower educators with AI-driven test generation, real-time grading, and
            comprehensive student analytics
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/register?role=teacher">
              <Button variant="primary" size="lg">
                👨‍🏫 I&apos;m a Teacher
              </Button>
            </Link>
            <Link href="/auth/register?role=student">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                👨‍🎓 I&apos;m a Student
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Powered Generation</h3>
            <p className="text-gray-600">
              Generate questions from PDFs, images, documents, or web research using Gemini API
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Auto Submission</h3>
            <p className="text-gray-600">
              Automatic test submission when students leave the tab to ensure test integrity
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Analytics</h3>
            <p className="text-gray-600">
              Detailed reports, performance tracking, and cheating detection system
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Difficulty Levels</h3>
            <p className="text-gray-600">
              Teachers can adjust test difficulty and create dynamic tests for different classes
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Class Management</h3>
            <p className="text-gray-600">
              Complete control over student enrollment, test assignment, and performance monitoring
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Leaderboards</h3>
            <p className="text-gray-600">
              Motivate students with rankings, prizes, and performance announcements
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-12 shadow-xl mb-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Key Features
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-semibold text-gray-900">Test Generation</h4>
                <p className="text-gray-600">From PDFs, images, documents, PowerPoints, and web</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-semibold text-gray-900">Auto Grading</h4>
                <p className="text-gray-600">Instant results with detailed feedback</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-semibold text-gray-900">Cheating Detection</h4>
                <p className="text-gray-600">AI-powered suspicious activity detection</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-semibold text-gray-900">Result Analytics</h4>
                <p className="text-gray-600">Comprehensive performance reports and insights</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-semibold text-gray-900">Class Management</h4>
                <p className="text-gray-600">Easy enrollment and test distribution</p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">✅</span>
              <div>
                <h4 className="font-semibold text-gray-900">Result Cards</h4>
                <p className="text-gray-600">Generate professional result certificates</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center py-10">
          <p className="text-white text-sm">
            © 2024 QuizApp. All rights reserved. | Built with ❤️ for educators
          </p>
        </div>
      </div>
    </div>
  )
}
