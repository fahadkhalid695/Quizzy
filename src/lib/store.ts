import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { IUser, UserRole } from '@/types'

interface AuthState {
  user: IUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: IUser, token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  setUser: (user: IUser) => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      setUser: (user) => set({ user }),
      hydrate: () => {
        // This function is called on app startup to restore state from localStorage
        const token = localStorage.getItem('token')
        if (token) {
          set({ token, isAuthenticated: true })
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      storage: typeof window !== 'undefined' ? require('zustand/middleware').default.localStorage : undefined,
    }
  )
)

// Class Management Store
interface ClassState {
  selectedClassId: string | null
  setSelectedClass: (classId: string) => void
  clearSelectedClass: () => void
}

export const useClassStore = create<ClassState>((set) => ({
  selectedClassId: null,
  setSelectedClass: (classId) => set({ selectedClassId: classId }),
  clearSelectedClass: () => set({ selectedClassId: null }),
}))

// Test Taking State
interface TestState {
  currentTestId: string | null
  isTestActive: boolean
  timeSpent: number
  currentQuestionIndex: number
  answers: Record<string, string>
  startTest: (testId: string) => void
  endTest: () => void
  updateAnswer: (questionId: string, answer: string) => void
  goToQuestion: (index: number) => void
  updateTimer: (seconds: number) => void
}

export const useTestStore = create<TestState>((set) => ({
  currentTestId: null,
  isTestActive: false,
  timeSpent: 0,
  currentQuestionIndex: 0,
  answers: {},
  startTest: (testId) =>
    set({
      currentTestId: testId,
      isTestActive: true,
      timeSpent: 0,
      currentQuestionIndex: 0,
      answers: {},
    }),
  endTest: () =>
    set({
      currentTestId: null,
      isTestActive: false,
    }),
  updateAnswer: (questionId, answer) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: answer,
      },
    })),
  goToQuestion: (index) => set({ currentQuestionIndex: index }),
  updateTimer: (seconds) => set({ timeSpent: seconds }),
}))

// UI State for notifications and modals
interface NotificationState {
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }>
  addNotification: (notification: Omit<NotificationState['notifications'][0], 'id'>) => void
  removeNotification: (id: string) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: Date.now().toString(),
        },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}))
