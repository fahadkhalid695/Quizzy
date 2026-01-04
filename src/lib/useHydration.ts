'use client'

import { useEffect, useState } from 'react'

// Custom hook to track hydration state
export function useHydration() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // This will only run on the client after hydration
    setHydrated(true)
  }, [])

  return hydrated
}

// Hook to safely access localStorage values
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error('Error reading localStorage:', error)
    }
    setIsInitialized(true)
  }, [key])

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error setting localStorage:', error)
    }
  }

  return [storedValue, setValue]
}
