'use client'

import { useState, useEffect } from 'react'
import { LoadingState, ActionFeedback, StepProgress } from './LoadingIndicator'

// Global feedback context for managing app-wide feedback states
interface FeedbackState {
  loading: boolean
  message?: string
  type?: 'success' | 'error' | 'warning' | 'info'
  progress?: number
  steps?: string[]
  currentStep?: number
}

// Feedback overlay for full-screen operations
interface FeedbackOverlayProps {
  isVisible: boolean
  title: string
  message?: string
  type?: 'loading' | 'success' | 'error'
  progress?: number
  onClose?: () => void
  children?: React.ReactNode
}

export function FeedbackOverlay({
  isVisible,
  title,
  message,
  type = 'loading',
  progress,
  onClose,
  children
}: FeedbackOverlayProps) {
  if (!isVisible) return null

  const typeConfig = {
    loading: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '⏳' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: '✅' },
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: '❌' }
  }

  const config = typeConfig[type]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`
        max-w-md w-full ${config.bg} ${config.border} border rounded-lg p-6 shadow-xl
        transform transition-all duration-300 scale-100
      `}>
        <div className="text-center space-y-4">
          <div className="text-4xl">{config.icon}</div>
          
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          
          {message && (
            <p className="text-sm text-gray-600">{message}</p>
          )}
          
          {type === 'loading' && (
            <LoadingState type="spinner" size="lg" color="blue" />
          )}
          
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{Math.round(progress)}% complete</p>
            </div>
          )}
          
          {children}
          
          {(type === 'success' || type === 'error') && onClose && (
            <button
              onClick={onClose}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 smooth-transition touch-target"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Inline feedback component for form fields and actions
interface InlineFeedbackProps {
  status: 'idle' | 'loading' | 'success' | 'error' | 'warning'
  message?: string
  showIcon?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function InlineFeedback({
  status,
  message,
  showIcon = true,
  size = 'md',
  className = ''
}: InlineFeedbackProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (status !== 'idle') {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [status])

  if (!isVisible || status === 'idle') return null

  const statusConfig = {
    loading: { color: 'text-blue-600', bg: 'bg-blue-50', icon: '⏳' },
    success: { color: 'text-green-600', bg: 'bg-green-50', icon: '✅' },
    error: { color: 'text-red-600', bg: 'bg-red-50', icon: '❌' },
    warning: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⚠️' }
  }

  const config = statusConfig[status]
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-2'

  return (
    <div className={`
      inline-flex items-center space-x-2 rounded-md ${config.bg} ${sizeClasses}
      transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      ${className}
    `}>
      {showIcon && (
        <span className="flex-shrink-0">
          {status === 'loading' ? (
            <LoadingState type="spinner" size="sm" color="blue" />
          ) : (
            <span>{config.icon}</span>
          )}
        </span>
      )}
      
      {message && (
        <span className={`font-medium ${config.color}`}>
          {message}
        </span>
      )}
    </div>
  )
}

// Floating action feedback for quick actions
interface FloatingFeedbackProps {
  isVisible: boolean
  message: string
  type: 'success' | 'error' | 'info'
  position?: 'top' | 'bottom'
  duration?: number
  onHide?: () => void
}

export function FloatingFeedback({
  isVisible,
  message,
  type,
  position = 'bottom',
  duration = 3000,
  onHide
}: FloatingFeedbackProps) {
  const [shouldRender, setShouldRender] = useState(isVisible)

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      if (duration > 0) {
        const timer = setTimeout(() => {
          onHide?.()
        }, duration)
        return () => clearTimeout(timer)
      }
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onHide])

  if (!shouldRender) return null

  const typeConfig = {
    success: { bg: 'bg-green-600', icon: '✅' },
    error: { bg: 'bg-red-600', icon: '❌' },
    info: { bg: 'bg-blue-600', icon: 'ℹ️' }
  }

  const config = typeConfig[type]
  const positionClasses = position === 'top' ? 'top-4' : 'bottom-4'

  return (
    <div className={`
      fixed left-1/2 transform -translate-x-1/2 ${positionClasses} z-50
      transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 
        position === 'top' ? '-translate-y-full opacity-0' : 'translate-y-full opacity-0'}
    `}>
      <div className={`
        ${config.bg} text-white px-4 py-3 rounded-lg shadow-lg
        flex items-center space-x-2 max-w-sm
      `}>
        <span>{config.icon}</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  )
}

// Progress tracker for multi-step operations
interface ProgressTrackerProps {
  steps: Array<{
    id: string
    title: string
    description?: string
  }>
  currentStepId: string
  completedStepIds: string[]
  errorStepIds?: string[]
  className?: string
}

export function ProgressTracker({
  steps,
  currentStepId,
  completedStepIds,
  errorStepIds = [],
  className = ''
}: ProgressTrackerProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStepId)
  const progress = (completedStepIds.length / steps.length) * 100

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full smooth-transition"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedStepIds.includes(step.id)
          const isError = errorStepIds.includes(step.id)
          const isCurrent = step.id === currentStepId
          const isPending = index > currentIndex && !isCompleted && !isError

          return (
            <div key={step.id} className="flex items-start space-x-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                smooth-transition
                ${isCompleted ? 'bg-green-600 text-white' : 
                  isError ? 'bg-red-600 text-white' :
                  isCurrent ? 'bg-blue-600 text-white' : 
                  'bg-gray-200 text-gray-600'}
              `}>
                {isCompleted ? '✓' : 
                 isError ? '✗' :
                 isCurrent ? (
                   <LoadingState type="spinner" size="sm" color="white" />
                 ) : index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`
                  text-sm font-medium
                  ${isCompleted ? 'text-green-600' :
                    isError ? 'text-red-600' :
                    isCurrent ? 'text-blue-600' : 
                    isPending ? 'text-gray-400' : 'text-gray-600'}
                `}>
                  {step.title}
                </h4>
                
                {step.description && (
                  <p className={`
                    text-xs mt-1
                    ${isCompleted ? 'text-green-500' :
                      isError ? 'text-red-500' :
                      isCurrent ? 'text-blue-500' : 
                      'text-gray-500'}
                  `}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Hook for managing feedback state
export function useFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState>({
    loading: false
  })

  const showLoading = (message?: string) => {
    setFeedback({ loading: true, message, type: 'info' })
  }

  const showSuccess = (message: string) => {
    setFeedback({ loading: false, message, type: 'success' })
  }

  const showError = (message: string) => {
    setFeedback({ loading: false, message, type: 'error' })
  }

  const showProgress = (progress: number, message?: string) => {
    setFeedback({ loading: true, progress, message, type: 'info' })
  }

  const showSteps = (steps: string[], currentStep: number, message?: string) => {
    setFeedback({ loading: true, steps, currentStep, message, type: 'info' })
  }

  const hide = () => {
    setFeedback({ loading: false })
  }

  return {
    feedback,
    showLoading,
    showSuccess,
    showError,
    showProgress,
    showSteps,
    hide
  }
}