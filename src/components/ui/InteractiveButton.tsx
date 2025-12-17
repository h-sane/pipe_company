'use client'

import { useState } from 'react'
import LoadingIndicator from './LoadingIndicator'

interface InteractiveButtonProps {
  children: React.ReactNode
  onClick?: () => void | Promise<void>
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  className?: string
  type?: 'button' | 'submit' | 'reset'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export default function InteractiveButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading: externalLoading = false,
  loadingText = 'Loading...',
  className = '',
  type = 'button',
  icon,
  iconPosition = 'left'
}: InteractiveButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false)
  
  const isLoading = externalLoading || internalLoading
  const isDisabled = disabled || isLoading

  const handleClick = async () => {
    if (isDisabled || !onClick) return

    try {
      setInternalLoading(true)
      await onClick()
    } catch (error) {
      console.error('Button action failed:', error)
    } finally {
      setInternalLoading(false)
    }
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200'
  }

  const disabledClasses = 'opacity-50 cursor-not-allowed'
  const interactiveClasses = 'hover:scale-105 active:scale-95 hover:shadow-lg smooth-transition hover-glow'

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${isDisabled ? disabledClasses : interactiveClasses}
    touch-target
    ${className}
  `.trim()

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      className={buttonClasses}
      aria-disabled={isDisabled}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <LoadingIndicator 
            size="sm" 
            color={variant === 'primary' || variant === 'danger' ? 'white' : 'blue'} 
          />
          <span>{loadingText}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          <span>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </div>
      )}
    </button>
  )
}

// Card component with hover effects
interface InteractiveCardProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  hoverable?: boolean
  elevated?: boolean
}

export function InteractiveCard({
  children,
  onClick,
  href,
  className = '',
  hoverable = true,
  elevated = false
}: InteractiveCardProps) {
  const baseClasses = 'bg-white rounded-lg border border-gray-200 transition-all duration-200'
  const elevatedClasses = elevated ? 'shadow-lg' : 'shadow-sm'
  const hoverClasses = hoverable ? 'hover:shadow-lg hover:scale-105 hover:border-gray-300 smooth-transition hover-glow' : ''
  const interactiveClasses = (onClick || href) ? 'cursor-pointer focus-ring touch-target' : ''

  const cardClasses = `${baseClasses} ${elevatedClasses} ${hoverClasses} ${interactiveClasses} ${className}`

  if (href) {
    return (
      <a href={href} className={cardClasses}>
        {children}
      </a>
    )
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={cardClasses}>
        {children}
      </button>
    )
  }

  return (
    <div className={cardClasses}>
      {children}
    </div>
  )
}

// Input with focus states and validation feedback
interface InteractiveInputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  success?: string
  disabled?: boolean
  required?: boolean
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  className?: string
}

export function InteractiveInput({
  label,
  placeholder,
  value,
  onChange,
  error,
  success,
  disabled = false,
  required = false,
  type = 'text',
  className = ''
}: InteractiveInputProps) {
  const [focused, setFocused] = useState(false)

  const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const stateClasses = error 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
    : success
    ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  
  const disabledClasses = disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'
  const focusClasses = focused ? 'scale-105 shadow-lg' : ''

  const inputClasses = `${baseClasses} ${stateClasses} ${disabledClasses} ${focusClasses} smooth-transition touch-target ${className}`

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        required={required}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'error-message' : success ? 'success-message' : undefined}
      />
      
      {error && (
        <p id="error-message" className="text-sm text-red-600 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
      
      {success && !error && (
        <p id="success-message" className="text-sm text-green-600 flex items-center space-x-1">
          <span>✅</span>
          <span>{success}</span>
        </p>
      )}
    </div>
  )
}