'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

// Simple page transition using CSS animations
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div
      className={`${className} ${
        isVisible ? 'animate-page-enter' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  )
}

// Stagger animation container
interface StaggerContainerProps {
  children: ReactNode
  className?: string
}

export function StaggerContainer({ children, className = '' }: StaggerContainerProps) {
  return <div className={`space-y-4 ${className}`}>{children}</div>
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  index?: number
}

export function StaggerItem({ children, className = '', index = 0 }: StaggerItemProps) {
  return (
    <div
      className={`animate-fade-in-up ${className}`}
      style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
    >
      {children}
    </div>
  )
}

// Animated Card with hover effects
interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  onClick?: () => void
}

export function AnimatedCard({ children, className = '', delay = 0, onClick }: AnimatedCardProps) {
  return (
    <div
      className={`animate-fade-in-up card-hover ${className}`}
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// Animated Button
interface AnimatedButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function AnimatedButton({ children, className = '', onClick, disabled, type = 'button' }: AnimatedButtonProps) {
  return (
    <button
      type={type}
      className={`btn-press transition-all duration-200 hover:scale-[1.02] active:scale-95 ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// Counter animation
interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
}

export function AnimatedCounter({ 
  value, 
  duration = 1, 
  className = '',
  prefix = '',
  suffix = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.floor(easeOutQuart * value))
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}

// Typing animation
interface TypingTextProps {
  text: string
  className?: string
  speed?: number
}

export function TypingText({ text, className = '', speed = 50 }: TypingTextProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className={className}>
      {displayText}
      <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>|</span>
    </span>
  )
}

// Floating animation wrapper
export function FloatingElement({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`animate-float ${className}`}>
      {children}
    </div>
  )
}

// Pulse animation wrapper
export function PulseElement({ 
  children, 
  className = '' 
}: { 
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`animate-pulse-scale ${className}`}>
      {children}
    </div>
  )
}

// Shimmer loading placeholder
export function ShimmerPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`skeleton rounded-lg ${className}`} />
  )
}

// Loading skeleton for cards
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${className}`}>
      <div className="skeleton h-12 w-12 rounded-xl mb-4" />
      <div className="skeleton h-8 w-24 mb-2" />
      <div className="skeleton h-4 w-32 mb-2" />
      <div className="skeleton h-3 w-20" />
    </div>
  )
}

// Loading skeleton for lists
export function ListSkeleton({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Success animation checkmark
export function SuccessCheckmark({ show }: { show: boolean }) {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="animate-scale-in-bounce">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-green-500/50">
          <span className="text-5xl text-white">✓</span>
        </div>
      </div>
    </div>
  )
}

// Error animation X mark
export function ErrorMark({ show }: { show: boolean }) {
  if (!show) return null
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="animate-shake">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-red-500/50">
          <span className="text-5xl text-white">✕</span>
        </div>
      </div>
    </div>
  )
}

// Animated progress bar
interface AnimatedProgressProps {
  progress: number
  className?: string
  color?: string
}

export function AnimatedProgress({ 
  progress, 
  className = '',
  color = 'from-purple-500 to-pink-500'
}: AnimatedProgressProps) {
  return (
    <div className={`h-2 bg-white/10 rounded-full overflow-hidden ${className}`}>
      <div 
        className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
}

// Bounce notification badge
export function NotificationBadge({ 
  count, 
  className = '' 
}: { 
  count: number
  className?: string
}) {
  if (count <= 0) return null
  
  return (
    <span className={`animate-bounce-gentle inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

// Glow button effect
export function GlowButton({ 
  children, 
  className = '',
  onClick 
}: { 
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <button 
      onClick={onClick}
      className={`relative group overflow-hidden ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      <div className="absolute inset-0 scale-0 group-hover:scale-100 bg-white/10 rounded-full transition-transform duration-500 origin-center" />
    </button>
  )
}

// Reveal on scroll (using Intersection Observer)
interface RevealOnScrollProps {
  children: ReactNode
  className?: string
  animation?: 'fade-in-up' | 'fade-in' | 'scale-in' | 'slide-in-right' | 'slide-in-left'
}

export function RevealOnScroll({ 
  children, 
  className = '',
  animation = 'fade-in-up'
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!ref) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(ref)
        }
      },
      { threshold: 0.1, rootMargin: '-50px' }
    )

    observer.observe(ref)

    return () => {
      if (ref) observer.unobserve(ref)
    }
  }, [ref])

  const animationClass = {
    'fade-in-up': 'animate-fade-in-up',
    'fade-in': 'animate-fade-in',
    'scale-in': 'animate-scale-in',
    'slide-in-right': 'animate-slide-in-right',
    'slide-in-left': 'animate-slide-in-left',
  }[animation]

  return (
    <div
      ref={setRef}
      className={`${className} ${isVisible ? animationClass : 'opacity-0'}`}
    >
      {children}
    </div>
  )
}
