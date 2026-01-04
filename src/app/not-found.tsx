'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] animate-float"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-[128px] animate-float-slow"
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
        />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse-glow"
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          />
        ))}

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Glitchy 404 */}
        <div className="relative mb-8">
          <h1 
            className="text-[180px] md:text-[250px] font-black leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #6366f1 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 60px rgba(168, 85, 247, 0.5))',
            }}
          >
            404
          </h1>
          
          {/* Glitch layers */}
          <h1 
            className="absolute inset-0 text-[180px] md:text-[250px] font-black leading-none select-none animate-glitch-1 opacity-70"
            style={{
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </h1>
          <h1 
            className="absolute inset-0 text-[180px] md:text-[250px] font-black leading-none select-none animate-glitch-2 opacity-70"
            style={{
              background: 'linear-gradient(135deg, #f43f5e 0%, #f97316 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </h1>
        </div>

        {/* Message */}
        <div className="space-y-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Oops! Page Not Found
          </h2>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            The page you&apos;re looking for seems to have wandered off into the digital void.
          </p>
        </div>

        {/* Animated mascot */}
        <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="relative inline-block">
            <div className="text-8xl animate-bounce-gentle">🔍</div>
            <div className="absolute -right-2 -top-2 text-3xl animate-wiggle">❓</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <Link
            href="/"
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span>🏠</span> Go Home
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="group px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:scale-105"
          >
            <span className="flex items-center gap-2">
              <span>←</span> Go Back
            </span>
          </button>
        </div>

        {/* Fun facts */}
        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <p className="text-gray-500 text-sm">
            Fun fact: The 404 error code means &quot;Not Found&quot; in HTTP speak 🤓
          </p>
        </div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-8 left-8 text-6xl opacity-10 animate-float">📚</div>
      <div className="absolute top-8 right-8 text-6xl opacity-10 animate-float-slow">✨</div>
      <div className="absolute bottom-8 left-8 text-6xl opacity-10 animate-float-slow">🎓</div>
      <div className="absolute bottom-8 right-8 text-6xl opacity-10 animate-float">💡</div>

      <style jsx>{`
        @keyframes glitch-1 {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          20% { clip-path: inset(20% 0 60% 0); transform: translate(-5px, 5px); }
          40% { clip-path: inset(40% 0 40% 0); transform: translate(5px, -5px); }
          60% { clip-path: inset(60% 0 20% 0); transform: translate(-5px, 5px); }
          80% { clip-path: inset(80% 0 5% 0); transform: translate(5px, -5px); }
        }
        @keyframes glitch-2 {
          0%, 100% { clip-path: inset(0 0 0 0); transform: translate(0); }
          20% { clip-path: inset(60% 0 20% 0); transform: translate(5px, -5px); }
          40% { clip-path: inset(20% 0 60% 0); transform: translate(-5px, 5px); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(5px, -5px); }
          80% { clip-path: inset(40% 0 40% 0); transform: translate(-5px, 5px); }
        }
        .animate-glitch-1 {
          animation: glitch-1 3s infinite linear;
        }
        .animate-glitch-2 {
          animation: glitch-2 3s infinite linear reverse;
        }
      `}</style>
    </div>
  )
}
