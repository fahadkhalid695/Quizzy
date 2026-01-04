'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/FormElements'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
        // Store token and redirect based on role
        localStorage.setItem('token', data.token)
        if (data.role === 'teacher') {
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
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-4 text-sm">
          ✓ Registration successful! Please log in with your credentials.
        </div>
      )}

      <h2 className="text-2xl font-bold text-center mb-2">Welcome Back</h2>
      <p className="text-center text-gray-600 text-sm mb-6">Sign in to your account</p>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="••••••••"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
        />

        <div className="text-right">
          <Link href="/auth/forgot-password" className="text-primary text-sm hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          className="w-full justify-center"
        >
          Sign In
        </Button>
      </form>

      <p className="text-center text-gray-600 text-sm mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-primary font-semibold hover:underline">
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
