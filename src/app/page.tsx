'use client'

import React from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Home() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Generation',
      description: 'Generate questions from PDFs, images, documents, or let AI research any topic for you',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: '⚡',
      title: 'Auto Submission',
      description: 'Smart test integrity with automatic submission when students leave the tab',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'Detailed reports, performance tracking, and AI-powered cheating detection',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: '🎯',
      title: 'Adaptive Difficulty',
      description: 'Customize test difficulty levels and create dynamic assessments for any class',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: '👥',
      title: 'Class Management',
      description: 'Complete control over enrollment, test distribution, and performance monitoring',
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: '🏆',
      title: 'Leaderboards',
      description: 'Motivate students with rankings, achievements, and performance celebrations',
      gradient: 'from-pink-500 to-rose-500',
    },
  ]

  const stats = [
    { value: '10K+', label: 'Questions Generated' },
    { value: '500+', label: 'Teachers' },
    { value: '5K+', label: 'Students' },
    { value: '99%', label: 'Satisfaction' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="bg-grid opacity-20" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl shadow-lg shadow-purple-500/30">
                📚
              </div>
              <h1 className="text-2xl font-bold gradient-text">QuizMaster</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" size="md">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="md">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium mb-8 animate-fade-in">
              <span className="animate-pulse">✨</span>
              Powered by Google Gemini AI
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in-up leading-tight">
              Create Quizzes in{' '}
              <span className="gradient-text">Seconds</span>
              <br />with AI Magic
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Upload any document, enter a topic, or paste text — our AI will generate 
              perfectly crafted quiz questions with instant grading and analytics.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link href="/auth/register?role=teacher">
                <Button variant="primary" size="xl" rightIcon={<span>→</span>}>
                  👨‍🏫 Start as Teacher
                </Button>
              </Link>
              <Link href="/auth/register?role=student">
                <Button variant="secondary" size="xl">
                  👨‍🎓 Join as Student
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex items-center justify-center gap-8 text-gray-500 text-sm animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <span className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Free to start
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-400">✓</span> No credit card
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Setup in 2 minutes
              </span>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute top-32 left-10 text-6xl animate-float opacity-20">📝</div>
          <div className="absolute top-48 right-16 text-5xl animate-float-slow opacity-20">🎓</div>
          <div className="absolute bottom-32 left-20 text-4xl animate-float opacity-20" style={{ animationDelay: '1s' }}>🏆</div>
          <div className="absolute bottom-48 right-24 text-5xl animate-float-slow opacity-20" style={{ animationDelay: '0.5s' }}>📊</div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-16 border-y border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">{stat.value}</div>
                <div className="text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Succeed</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A complete platform for creating, managing, and analyzing educational assessments
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-24 bg-black/30 backdrop-blur-xl border-y border-white/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Get Started in{' '}
              <span className="gradient-text">3 Simple Steps</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '1', title: 'Upload or Enter Topic', desc: 'Add your study material or simply type a topic for AI research', icon: '📄' },
              { step: '2', title: 'AI Generates Quiz', desc: 'Our AI creates perfectly crafted questions with answers', icon: '🤖' },
              { step: '3', title: 'Share & Analyze', desc: 'Distribute to students and get instant analytics', icon: '📈' },
            ].map((item, i) => (
              <div key={i} className="relative text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.2}s` }}>
                {/* Step number */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/30">
                  {item.step}
                </div>

                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent" />
                )}

                <div className="text-5xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20 backdrop-blur-xl border border-white/20 rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Transform Your Teaching?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of educators already using QuizMaster
            </p>
            <Link href="/auth/register">
              <Button variant="primary" size="xl">
                Start Free Today 🚀
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2026 QuizMaster. All rights reserved. | Built with ❤️ for educators
          </p>
        </div>
      </footer>
    </div>
  )
}
