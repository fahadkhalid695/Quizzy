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
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">⚙️</div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="bg-white rounded-lg p-8 text-center max-w-md">
          <p className="text-red-600 font-semibold mb-4">Access Denied</p>
          <p className="text-gray-600">
            This page is only available to {requiredRole}s.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
