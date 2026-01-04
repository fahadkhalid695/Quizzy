'use client'

import { useEffect, useState } from 'react'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export default function LoadingScreen({ 
  message = 'Loading...', 
  fullScreen = true 
}: LoadingScreenProps) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  const content = (
    <div className="text-center">
      {/* Animated Logo/Spinner */}
      <div className="relative mb-8">
        {/* Outer ring */}
        <div className="w-24 h-24 mx-auto">
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-2 border-4 border-transparent border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
            <span className="text-2xl">📚</span>
          </div>
        </div>
      </div>

      {/* Text */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">
          {message}<span className="inline-block w-6 text-left">{dots}</span>
        </h2>
        <p className="text-gray-400 text-sm">Please wait while we prepare everything</p>
      </div>

      {/* Progress bar */}
      <div className="mt-6 w-48 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-shimmer" style={{ width: '100%' }} />
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 flex items-center justify-center">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10">
          {content}
        </div>
      </div>
    )
  }

  return content
}

// Simple spinner
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  return (
    <div className={`${sizeClasses[size]} border-purple-500/30 border-t-purple-500 rounded-full animate-spin ${className}`} />
  )
}

// Skeleton loaders
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-4 rounded"
          style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="skeleton w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
          <div className="flex gap-4 mt-4">
            <div className="skeleton h-3 w-16 rounded" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="grid gap-4 p-4 bg-white/5 border-b border-white/10" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-4 rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 p-4 border-b border-white/5 last:border-0"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="skeleton h-4 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Pulse loading indicator
export function PulseLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

// Loading overlay
export function LoadingOverlay({ show, message = 'Processing...' }: { show: boolean; message?: string }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-8 text-center max-w-sm mx-4 animate-scale-in">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-white font-medium">{message}</p>
      </div>
    </div>
  )
}
