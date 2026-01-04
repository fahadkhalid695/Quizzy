'use client'

import React, { useEffect } from 'react'
import { useNotificationStore } from '@/lib/store'

export function NotificationProvider() {
  const notifications = useNotificationStore((state) => state.notifications)
  const removeNotification = useNotificationStore((state) => state.removeNotification)

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

interface NotificationProps {
  notification: {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }
  onClose: () => void
}

function Notification({ notification, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const baseStyles = 'p-4 rounded-lg shadow-lg text-white flex items-center gap-3 animate-slide-in'

  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return (
    <div className={`${baseStyles} ${typeStyles[notification.type]}`}>
      <span className="text-xl font-bold">{icons[notification.type]}</span>
      <span className="flex-1">{notification.message}</span>
      <button
        onClick={onClose}
        className="text-white hover:opacity-75 transition"
      >
        ✕
      </button>
    </div>
  )
}

export function useNotify() {
  const addNotification = useNotificationStore((state) => state.addNotification)

  return {
    success: (message: string) =>
      addNotification({ type: 'success', message }),
    error: (message: string) =>
      addNotification({ type: 'error', message }),
    warning: (message: string) =>
      addNotification({ type: 'warning', message }),
    info: (message: string) =>
      addNotification({ type: 'info', message }),
  }
}
