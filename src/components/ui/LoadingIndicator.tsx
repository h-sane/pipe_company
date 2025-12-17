interface LoadingIndicatorProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'white' | 'gray'
  text?: string
  className?: string
}

export default function LoadingIndicator({ 
  size = 'md', 
  color = 'blue', 
  text,
  className = '' 
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600'
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <span className={`text-sm ${colorClasses[color]}`}>
          {text}
        </span>
      )}
    </div>
  )
}

// Progress bar component for longer operations
interface ProgressBarProps {
  progress: number // 0-100
  color?: 'blue' | 'green' | 'red'
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  className?: string
}

export function ProgressBar({ 
  progress, 
  color = 'blue', 
  size = 'md',
  showPercentage = false,
  className = '' 
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600'
  }

  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={className}>
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 mt-1 text-center">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  )
}

// Skeleton loader for content placeholders
interface SkeletonProps {
  width?: string
  height?: string
  className?: string
  animate?: boolean
}

export function Skeleton({ 
  width = 'w-full', 
  height = 'h-4', 
  className = '',
  animate = true 
}: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 rounded ${width} ${height} ${animate ? 'animate-pulse' : ''} ${className}`}
      role="status"
      aria-label="Loading content"
    />
  )
}

// Button loading state component
interface ButtonLoadingProps {
  isLoading: boolean
  children: React.ReactNode
  loadingText?: string
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export function ButtonWithLoading({
  isLoading,
  children,
  loadingText = 'Loading...',
  disabled = false,
  className = '',
  onClick,
  type = 'button'
}: ButtonLoadingProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center transition-all duration-200 ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
      } ${className}`}
    >
      {isLoading && (
        <LoadingIndicator 
          size="sm" 
          color="white" 
          className="absolute inset-0" 
        />
      )}
      <span className={isLoading ? 'invisible' : 'visible'}>
        {isLoading ? loadingText : children}
      </span>
    </button>
  )
}

// Enhanced loading states for different scenarios
interface LoadingStateProps {
  type: 'spinner' | 'dots' | 'pulse' | 'skeleton'
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'white' | 'gray'
  text?: string
  className?: string
}

export function LoadingState({ 
  type, 
  size = 'md', 
  color = 'blue', 
  text,
  className = '' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    blue: 'text-blue-600',
    white: 'text-white',
    gray: 'text-gray-600'
  }

  if (type === 'spinner') {
    return <LoadingIndicator size={size} color={color} text={text} className={className} />
  }

  if (type === 'dots') {
    return (
      <div className={`flex items-center justify-center space-x-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full animate-pulse`}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: '1s'
            }}
          />
        ))}
        {text && (
          <span className={`ml-2 text-sm ${colorClasses[color]}`}>
            {text}
          </span>
        )}
      </div>
    )
  }

  if (type === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`${sizeClasses[size]} ${colorClasses[color]} bg-current rounded-full loading-pulse`} />
        {text && (
          <span className={`ml-2 text-sm ${colorClasses[color]}`}>
            {text}
          </span>
        )}
      </div>
    )
  }

  if (type === 'skeleton') {
    return <Skeleton className={className} animate={true} />
  }

  return null
}

// Interactive feedback component for user actions
interface ActionFeedbackProps {
  action: 'save' | 'delete' | 'upload' | 'download' | 'send' | 'custom'
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
  customIcon?: React.ReactNode
  onRetry?: () => void
  className?: string
}

export function ActionFeedback({
  action,
  status,
  message,
  customIcon,
  onRetry,
  className = ''
}: ActionFeedbackProps) {
  const actionIcons = {
    save: '💾',
    delete: '🗑️',
    upload: '📤',
    download: '📥',
    send: '📧',
    custom: customIcon || '⚡'
  }

  const statusConfig = {
    idle: { color: 'text-gray-600', bg: 'bg-gray-100' },
    loading: { color: 'text-blue-600', bg: 'bg-blue-100' },
    success: { color: 'text-green-600', bg: 'bg-green-100' },
    error: { color: 'text-red-600', bg: 'bg-red-100' }
  }

  const config = statusConfig[status]

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg ${config.bg} ${className}`}>
      <span className="text-lg">{actionIcons[action]}</span>
      
      {status === 'loading' && (
        <LoadingIndicator size="sm" color="blue" />
      )}
      
      {status === 'success' && (
        <span className="text-lg">✅</span>
      )}
      
      {status === 'error' && (
        <span className="text-lg">❌</span>
      )}
      
      {message && (
        <span className={`text-sm font-medium ${config.color}`}>
          {message}
        </span>
      )}
      
      {status === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}

// Progress indicator with steps
interface StepProgressProps {
  steps: string[]
  currentStep: number
  completedSteps?: number[]
  errorSteps?: number[]
  className?: string
}

export function StepProgress({
  steps,
  currentStep,
  completedSteps = [],
  errorSteps = [],
  className = ''
}: StepProgressProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Step {currentStep + 1} of {steps.length}</span>
        <span>{Math.round(((completedSteps.length) / steps.length) * 100)}% Complete</span>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index)
          const isError = errorSteps.includes(index)
          const isCurrent = index === currentStep
          
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                ${isCompleted ? 'bg-green-600 text-white' : 
                  isError ? 'bg-red-600 text-white' :
                  isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
              `}>
                {isCompleted ? '✓' : 
                 isError ? '✗' :
                 isCurrent ? <LoadingIndicator size="sm" color="white" /> : 
                 index + 1}
              </div>
              
              <span className={`
                text-sm
                ${isCompleted ? 'text-green-600 font-medium' :
                  isError ? 'text-red-600' :
                  isCurrent ? 'text-blue-600 font-medium' : 'text-gray-600'}
              `}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}