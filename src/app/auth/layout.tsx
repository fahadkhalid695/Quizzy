import React from 'react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        <div className="relative z-10 text-center max-w-lg">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-purple-500/30">
              📚
            </div>
            <span className="text-3xl font-bold text-white">Quizzy</span>
          </Link>

          {/* Illustration */}
          <div className="mb-8">
            <div className="text-[120px] animate-float">🎓</div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-4">
            Welcome to the Future of Learning
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Create AI-powered quizzes, track student progress, and transform education with intelligent assessments.
          </p>

          {/* Features list */}
          <div className="space-y-3 text-left">
            {[
              'AI-generated questions from any content',
              'Real-time grading and analytics',
              'Anti-cheating protection built-in',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-300">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 right-20 text-5xl animate-float-slow opacity-20">📝</div>
        <div className="absolute bottom-32 left-20 text-4xl animate-float opacity-20">🏆</div>
        <div className="absolute top-1/2 right-12 text-6xl animate-bounce-gentle opacity-20">⭐</div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl shadow-lg shadow-purple-500/30">
                📚
              </div>
              <span className="text-2xl font-bold text-white">QuizMaster</span>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 animate-fade-in-up">
            {children}
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            © 2026 QuizMaster. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
