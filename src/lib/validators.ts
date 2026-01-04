import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateClassCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
