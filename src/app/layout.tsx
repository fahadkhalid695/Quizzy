import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Quiz App - Dynamic Testing Platform',
  description:
    'Comprehensive Quiz Management System with AI-powered test generation, auto-grading, and cheating detection',
  keywords: ['quiz', 'test', 'education', 'learning management system'],
  viewport: 'width=device-width, initial-scale=1',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:3000',
    siteName: 'Quiz App',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-light text-dark">
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  )
}
