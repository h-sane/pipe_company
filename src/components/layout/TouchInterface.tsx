'use client'

import { useState, useRef } from 'react'

// Touch-friendly button component
interface TouchButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
  loading?: boolean
  'data-testid'?: string
}

export function TouchButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon,
  loading = false,
  'data-testid': dataTestId
}: TouchButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const sizeClasses = {
    sm: 'touch-target px-4 py-3 text-sm',
    md: 'touch-target-large px-6 py-4 text-base',
    lg: 'min-h-[56px] min-w-[56px] px-8 py-5 text-lg'
  }

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200'
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg smooth-transition focus-ring disabled:opacity-50 disabled:cursor-not-allowed'
  const interactiveClasses = !disabled && !loading ? 'interactive-scale hover-glow' : ''

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      data-testid={dataTestId}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        transform: isPressed && !disabled && !loading ? 'scale(0.95)' : undefined
      }}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </div>
      )}
    </button>
  )
}

// Touch-friendly input component
interface TouchInputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  error?: string
  disabled?: boolean
  required?: boolean
  className?: string
  'data-testid'?: string
}

export function TouchInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  error,
  disabled = false,
  required = false,
  className = '',
  'data-testid': dataTestId
}: TouchInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        data-testid={dataTestId}
        className={`
          block w-full touch-target-large px-4 py-4 text-base border rounded-lg
          smooth-transition focus-ring
          ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}
          ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'}
          ${isFocused ? 'shadow-lg' : 'shadow-sm'}
        `}
        style={{
          fontSize: '16px' // Prevents zoom on iOS
        }}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'error-message' : undefined}
      />
      
      {error && (
        <p id="error-message" className="text-sm text-red-600 flex items-center space-x-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

// Touch-friendly card component
interface TouchCardProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  elevated?: boolean
  'data-testid'?: string
}

export function TouchCard({
  children,
  onClick,
  className = '',
  elevated = false,
  'data-testid': dataTestId
}: TouchCardProps) {
  const [isPressed, setIsPressed] = useState(false)

  const baseClasses = 'bg-white rounded-lg border border-gray-200 smooth-transition'
  const elevatedClasses = elevated ? 'shadow-lg' : 'shadow-sm'
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-lg hover:border-gray-300 focus-ring' : ''

  return (
    <div
      className={`${baseClasses} ${elevatedClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      onTouchStart={() => onClick && setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => onClick && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      data-testid={dataTestId}
      style={{
        transform: isPressed && onClick ? 'scale(0.98)' : undefined
      }}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  )
}

// Swipe gesture handler
interface SwipeHandlerProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  className?: string
}

export function SwipeHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = ''
}: SwipeHandlerProps) {
  const startPos = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    startPos.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!startPos.current) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - startPos.current.x
    const deltaY = touch.clientY - startPos.current.y

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    if (Math.max(absDeltaX, absDeltaY) < threshold) return

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown()
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp()
      }
    }

    startPos.current = null
  }

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}

// Touch-friendly toggle switch
interface TouchToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function TouchToggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md'
}: TouchToggleProps) {
  const sizeClasses = {
    sm: { container: 'w-8 h-5', thumb: 'w-4 h-4', translate: 'translate-x-3' },
    md: { container: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { container: 'w-14 h-8', thumb: 'w-7 h-7', translate: 'translate-x-6' }
  }

  const classes = sizeClasses[size]

  return (
    <label className="flex items-center space-x-3 cursor-pointer">
      <div className={`relative touch-target ${classes.container}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`
            ${classes.container} rounded-full smooth-transition
            ${checked ? 'bg-blue-600' : 'bg-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div
            className={`
              ${classes.thumb} bg-white rounded-full shadow-md smooth-transition
              transform ${checked ? classes.translate : 'translate-x-0.5'}
              absolute top-0.5
            `}
          />
        </div>
      </div>
      {label && (
        <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
          {label}
        </span>
      )}
    </label>
  )
}

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  className?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = ''
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault()
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    setPullDistance(0)
    startY.current = null
  }

  const refreshProgress = Math.min(pullDistance / threshold, 1)

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 smooth-transition"
        style={{
          height: Math.max(pullDistance, 0),
          opacity: refreshProgress
        }}
      >
        {isRefreshing ? (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Refreshing...</span>
          </div>
        ) : pullDistance > 0 ? (
          <div className="flex items-center space-x-2 text-blue-600">
            <div
              className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"
              style={{
                transform: `rotate(${refreshProgress * 360}deg)`
              }}
            />
            <span className="text-sm font-medium">
              {pullDistance >= threshold ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        ) : null}
      </div>
      
      <div style={{ paddingTop: Math.max(pullDistance, 0) }}>
        {children}
      </div>
    </div>
  )
}