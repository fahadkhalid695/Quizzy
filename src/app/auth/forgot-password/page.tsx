'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/FormElements';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // For development only - show the reset link
        if (data.resetUrl) {
          setDevLink(data.resetUrl);
        }
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">📧</div>
        <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
        <p className="text-gray-600 mb-6">
          If an account exists for {email}, we've sent password reset instructions.
        </p>
        
        {devLink && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              ⚠️ Development Mode - Reset Link:
            </p>
            <a
              href={devLink}
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {devLink}
            </a>
          </div>
        )}

        <Link
          href="/auth/login"
          className="text-primary font-semibold hover:underline"
        >
          ← Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mb-2">Forgot Password?</h2>
      <p className="text-center text-gray-600 text-sm mb-6">
        Enter your email and we'll send you reset instructions
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          className="w-full justify-center"
        >
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-gray-600 text-sm mt-6">
        Remember your password?{' '}
        <Link href="/auth/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
