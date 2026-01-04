import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = `
    relative font-semibold rounded-xl 
    transition-all duration-300 ease-out
    flex items-center justify-center gap-2
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500/50
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-[0.98]
    overflow-hidden
  `

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500
      hover:from-purple-500 hover:via-purple-400 hover:to-pink-400
      text-white shadow-lg shadow-purple-500/30
      hover:shadow-xl hover:shadow-purple-500/40
      hover:-translate-y-0.5
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/20 before:to-white/0
      before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700
    `,
    secondary: `
      bg-white/10 backdrop-blur-md border border-white/20
      text-white hover:bg-white/20
      hover:border-purple-400/50
      hover:-translate-y-0.5
    `,
    outline: `
      bg-transparent border-2 border-purple-500
      text-purple-400 hover:bg-purple-500/10
      hover:border-purple-400 hover:text-purple-300
      hover:-translate-y-0.5
    `,
    ghost: `
      bg-transparent text-gray-300
      hover:bg-white/10 hover:text-white
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-500
      hover:from-red-500 hover:to-red-400
      text-white shadow-lg shadow-red-500/30
      hover:shadow-xl hover:shadow-red-500/40
      hover:-translate-y-0.5
    `,
    success: `
      bg-gradient-to-r from-emerald-600 to-emerald-500
      hover:from-emerald-500 hover:to-emerald-400
      text-white shadow-lg shadow-emerald-500/30
      hover:shadow-xl hover:shadow-emerald-500/40
      hover:-translate-y-0.5
    `,
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  }

  return (
    <button
      className={`
        ${baseStyles} 
        ${variantStyles[variant]} 
        ${sizeStyles[size]} 
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'pointer-events-none' : ''} 
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" cy="12" r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  )
}

export default Button
