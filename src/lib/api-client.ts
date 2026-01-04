import { useAuthStore } from '@/lib/store'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
}

export async function apiCall<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  // Get token from Zustand store
  let token = useAuthStore.getState().token
  
  // Fallback: try to get token from localStorage directly if store is empty
  if (!token && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        token = parsed.state?.token || null
      }
    } catch (e) {
      console.error('Error reading token from localStorage:', e)
    }
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`

  console.log('API Call:', options.method || 'GET', normalizedEndpoint);

  try {
    const response = await fetch(normalizedEndpoint, {
      method: options.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...(options.body && { body: JSON.stringify(options.body) }),
    })

    console.log('API Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        useAuthStore.getState().logout()
      }
      const error = await response.json()
      console.error('API Error:', error);
      throw new Error(error.error || 'API Error')
    }

    const data = await response.json()
    console.log('API Response data:', data);
    return data
  } catch (error) {
    console.error('API Call failed:', error);
    throw error;
  }
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
