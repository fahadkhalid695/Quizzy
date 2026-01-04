import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'QuizMaster - AI-Powered Quiz Platform',
  description:
    'Comprehensive Quiz Management System with AI-powered test generation, auto-grading, and analytics',
  keywords: ['quiz', 'test', 'education', 'learning management system', 'AI'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quizmaster.app',
    siteName: 'QuizMaster',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-white antialiased">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  )
}
