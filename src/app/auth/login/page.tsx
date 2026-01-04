'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/lib/store'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const registered = searchParams.get('registered') === 'true'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store in Zustand (which persists to localStorage)
        login(data.user, data.token)
        
        // Also store token separately for API calls
        localStorage.setItem('token', data.token)
        
        // Redirect based on role
        if (data.user.role === 'teacher') {
          router.push('/teacher/dashboard')
        } else {
          router.push('/student/dashboard')
        }
      } else {
        const data = await response.json()
        setErrors({ submit: data.error || 'Login failed' })
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {registered && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-300 p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
          <span className="text-lg">✓</span>
          Registration successful! Please sign in.
        </div>
      )}

      <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h2>
      <p className="text-center text-gray-400 text-sm mb-6">Sign in to continue your journey</p>

      {errors.submit && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 p-3 rounded-xl mb-4 text-sm flex items-center gap-2">
          <span>⚠️</span>
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>

        <div className="text-right">
          <Link href="/auth/forgot-password" className="text-purple-400 text-sm hover:text-purple-300 transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          fullWidth
          size="lg"
        >
          Sign In
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-transparent text-gray-500">or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all">
          <span>🔵</span> Google
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all">
          <span>⚫</span> GitHub
        </button>
      </div>

      <p className="text-center text-gray-400 text-sm mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <LoginContent />
    </Suspense>
  )
}
