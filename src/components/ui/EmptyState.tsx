'use client';

import React from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      {/* Animated icon */}
      <div className="relative mb-6">
        <div className="text-7xl animate-bounce-gentle">{icon}</div>
        <div className="absolute inset-0 text-7xl blur-xl opacity-30 animate-pulse">
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-white mb-2 text-center">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-gray-400 text-center max-w-md mb-6">{description}</p>
      )}

      {/* Action button */}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}

      {/* Decorative elements */}
      <div className="absolute pointer-events-none">
        <div className="w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

// Preset empty states
export function NoDataEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="📊"
      title="No Data Yet"
      description="There's nothing to show here yet. Start by adding some content!"
      action={onAction ? { label: 'Get Started', onClick: onAction } : undefined}
    />
  );
}

export function NoTestsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="📝"
      title="No Tests Available"
      description="You don't have any tests to take right now. Check back later!"
      action={onAction ? { label: 'Browse Tests', onClick: onAction } : undefined}
    />
  );
}

export function NoResultsEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon="🏆"
      title="No Results Yet"
      description="You haven't completed any tests yet. Take your first test to see results here!"
      action={onAction ? { label: 'Take a Test', onClick: onAction } : undefined}
    />
  );
}

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="No Results Found"
      description={`We couldn't find anything matching "${query}". Try a different search term.`}
    />
  );
}

export function ErrorEmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Something Went Wrong"
      description="We encountered an error while loading this content. Please try again."
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
    />
  );
}
