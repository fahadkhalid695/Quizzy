import React from 'react'

interface CardProps {
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient'
  hover?: boolean
  animate?: boolean
}

export function Card({ 
  className = '', 
  children, 
  variant = 'default',
  hover = true,
  animate = false
}: CardProps) {
  const baseStyles = `
    relative rounded-2xl overflow-hidden
    transition-all duration-500 ease-out
  `
  
  const variantStyles = {
    default: `
      bg-white/10 backdrop-blur-xl 
      border border-white/20
      shadow-xl shadow-black/10
    `,
    elevated: `
      bg-gradient-to-br from-white/15 to-white/5 
      backdrop-blur-xl 
      border border-white/20
      shadow-2xl shadow-purple-500/10
    `,
    bordered: `
      bg-white/5 backdrop-blur-xl
      border-2 border-purple-500/30
    `,
    gradient: `
      bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20
      backdrop-blur-xl 
      border border-white/20
      shadow-2xl shadow-purple-500/20
    `,
  }

  const hoverStyles = hover ? `
    hover:bg-white/15
    hover:border-purple-400/50
    hover:shadow-2xl hover:shadow-purple-500/20
    hover:-translate-y-1
    group
  ` : ''

  const animateStyles = animate ? 'animate-fade-in-up' : ''

  return (
    <div 
      className={`
        ${baseStyles} 
        ${variantStyles[variant]} 
        ${hoverStyles} 
        ${animateStyles}
        p-6 
        ${className}
      `}
    >
      {/* Gradient border on hover */}
      {hover && (
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-blue-500/50 blur-sm" />
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function CardHeader({ title, subtitle, icon, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 pb-4 border-b border-white/10">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg shadow-lg shadow-purple-500/30">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`text-gray-300 ${className}`}>{children}</div>
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-white/10 flex items-center gap-3 ${className}`}>
      {children}
    </div>
  )
}

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
