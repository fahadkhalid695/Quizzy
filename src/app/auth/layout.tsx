import React from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">📚 QuizApp</h1>
          <p className="text-gray-600 text-sm mt-2">Dynamic Quiz Management System</p>
        </div>
        {children}
      </div>
    </div>
  )
}
