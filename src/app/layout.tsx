import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'
import Providers from '@/components/common/Providers'

export const metadata: Metadata = {
  title: 'Quizzy - AI-Powered Quiz Platform',
  description:
    'Comprehensive Quiz Management System with AI-powered test generation, auto-grading, and analytics',
  keywords: ['quiz', 'test', 'education', 'learning management system', 'AI', 'Quizzy', 'exam', 'student', 'teacher'],
  authors: [{ name: 'Quizzy Team' }],
  metadataBase: new URL('https://quizzy.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://quizzy.app',
    siteName: 'Quizzy',
    title: 'Quizzy - AI-Powered Quiz Platform',
    description: 'Transform education with AI-powered quizzes, real-time analytics, and instant grading.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quizzy - AI-Powered Quiz Platform',
    description: 'Transform education with AI-powered quizzes, real-time analytics, and instant grading.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/quizzy-logo.svg',
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
        <Providers>
          <div className="min-h-screen">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
