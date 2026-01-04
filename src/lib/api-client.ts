import { useAuthStore } from '@/lib/store'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
}

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function apiCall<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = useAuthStore.getState().token

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...(options.body && { body: JSON.stringify(options.body) }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      useAuthStore.getState().logout()
    }
    const error = await response.json()
    throw new Error(error.error || 'API Error')
  }

  return response.json()
}

// Helper functions
export const api = {
  get: <T,>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'GET' }),

  post: <T,>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, { method: 'POST', body }),

  put: <T,>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, { method: 'PUT', body }),

  delete: <T,>(endpoint: string) =>
    apiCall<T>(endpoint, { method: 'DELETE' }),

  patch: <T,>(endpoint: string, body: any) =>
    apiCall<T>(endpoint, { method: 'PATCH', body }),
}
