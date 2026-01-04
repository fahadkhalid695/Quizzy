'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [role, setRole] = useState<'teacher' | 'student'>(
    (searchParams.get('role') as 'teacher' | 'student') || 'student'
  )

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role,
        }),
      })

      if (response.ok) {
        router.push('/auth/login?registered=true')
      } else {
        const data = await response.json()
        setErrors({ submit: data.error || 'Registration failed' })
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold text-white text-center mb-2">Create Account</h2>
      <p className="text-gray-400 text-center mb-8">Join QuizMaster and start learning</p>

      {/* Role Selection */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-300 mb-3">I am a:</p>
        <div className="grid grid-cols-2 gap-4">
          <label 
            className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              role === 'student' 
                ? 'bg-purple-500/20 border-purple-500 text-white' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              value="student"
              checked={role === 'student'}
              onChange={(e) => setRole(e.target.value as 'student')}
              className="sr-only"
            />
            <span className="text-2xl">👨‍🎓</span>
            <span className="font-medium">Student</span>
          </label>
          <label 
            className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              role === 'teacher' 
                ? 'bg-purple-500/20 border-purple-500 text-white' 
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              value="teacher"
              checked={role === 'teacher'}
              onChange={(e) => setRole(e.target.value as 'teacher')}
              className="sr-only"
            />
            <span className="text-2xl">👨‍🏫</span>
            <span className="font-medium">Teacher</span>
          </label>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
          <span>⚠️</span> {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              className={`w-full px-4 py-3 bg-white/5 border ${errors.firstName ? 'border-red-500/50' : 'border-white/10'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
              required
            />
            {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              className={`w-full px-4 py-3 bg-white/5 border ${errors.lastName ? 'border-red-500/50' : 'border-white/10'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
              required
            />
            {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className={`w-full px-4 py-3 bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
            required
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-4 py-3 bg-white/5 border ${errors.password ? 'border-red-500/50' : 'border-white/10'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
            required
          />
          <p className="text-gray-500 text-xs mt-1">At least 6 characters</p>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-4 py-3 bg-white/5 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'} rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all`}
            required
          />
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          fullWidth
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-gray-400 text-sm mt-8">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <RegisterContent />
    </Suspense>
  )
}
