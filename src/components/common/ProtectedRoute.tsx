'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'teacher' | 'student'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuthStore()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    
    if (!token && !isLoading) {
      router.push('/auth/login')
      return
    }

    // Check role if required
    if (requiredRole && user && user.role !== requiredRole) {
      router.push('/')
    }
  }, [isAuthenticated, user, router, requiredRole, isLoading])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center max-w-md">
          <p className="text-red-400 font-semibold mb-4">Access Denied</p>
          <p className="text-gray-300">
            This page is only available to {requiredRole}s.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
