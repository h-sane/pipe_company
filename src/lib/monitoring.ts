/**
 * Monitoring and observability utilities
 * Provides logging, metrics, and error tracking
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private logLevel: LogLevel
  private format: 'json' | 'pretty'

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'
    this.format = (process.env.LOG_FORMAT as 'json' | 'pretty') || 'json'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex <= currentLevelIndex
  }

  private formatLog(entry: LogEntry): string {
    if (this.format === 'json') {
      return JSON.stringify({
        ...entry,
        error: entry.error ? {
          message: entry.error.message,
          stack: entry.error.stack,
          name: entry.error.name,
        } : undefined,
      })
    } else {
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
      const errorStr = entry.error ? `\n${entry.error.stack}` : ''
      return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}${contextStr}${errorStr}`
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }

    const formatted = this.formatLog(entry)

    switch (level) {
      case 'error':
        console.error(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'debug':
        console.debug(formatted)
        break
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, context, error)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }
}

// Singleton logger instance
export const logger = new Logger()

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private timers: Map<string, number>

  constructor() {
    this.timers = new Map()
  }

  /**
   * Start timing an operation
   */
  start(operationName: string): void {
    this.timers.set(operationName, Date.now())
  }

  /**
   * End timing and log duration
   */
  end(operationName: string, context?: Record<string, any>): number {
    const startTime = this.timers.get(operationName)
    if (!startTime) {
      logger.warn(`No start time found for operation: ${operationName}`)
      return 0
    }

    const duration = Date.now() - startTime
    this.timers.delete(operationName)

    logger.debug(`Operation completed: ${operationName}`, {
      ...context,
      duration: `${duration}ms`,
    })

    return duration
  }

  /**
   * Measure async operation
   */
  async measure<T>(
    operationName: string,
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    this.start(operationName)
    try {
      const result = await operation()
      this.end(operationName, context)
      return result
    } catch (error) {
      this.end(operationName, { ...context, error: true })
      throw error
    }
  }
}

// Singleton performance monitor
export const perfMonitor = new PerformanceMonitor()

/**
 * Error tracking utilities
 */
export class ErrorTracker {
  private errorCounts: Map<string, number>
  private lastErrors: Map<string, Date>

  constructor() {
    this.errorCounts = new Map()
    this.lastErrors = new Map()
  }

  /**
   * Track an error occurrence
   */
  track(errorType: string, error: Error, context?: Record<string, any>): void {
    const count = (this.errorCounts.get(errorType) || 0) + 1
    this.errorCounts.set(errorType, count)
    this.lastErrors.set(errorType, new Date())

    logger.error(`Error tracked: ${errorType}`, error, {
      ...context,
      count,
      errorType,
    })
  }

  /**
   * Get error statistics
   */
  getStats(): Record<string, { count: number; lastOccurrence: Date }> {
    const stats: Record<string, { count: number; lastOccurrence: Date }> = {}
    
    this.errorCounts.forEach((count, errorType) => {
      const lastOccurrence = this.lastErrors.get(errorType)
      if (lastOccurrence) {
        stats[errorType] = { count, lastOccurrence }
      }
    })

    return stats
  }

  /**
   * Reset error statistics
   */
  reset(): void {
    this.errorCounts.clear()
    this.lastErrors.clear()
  }
}

// Singleton error tracker
export const errorTracker = new ErrorTracker()

/**
 * Request metrics tracking
 */
export interface RequestMetrics {
  path: string
  method: string
  statusCode: number
  duration: number
  timestamp: Date
}

class MetricsCollector {
  private requests: RequestMetrics[]
  private maxSize: number

  constructor(maxSize: number = 1000) {
    this.requests = []
    this.maxSize = maxSize
  }

  /**
   * Record a request
   */
  recordRequest(metrics: RequestMetrics): void {
    this.requests.push(metrics)
    
    // Keep only recent requests
    if (this.requests.length > this.maxSize) {
      this.requests.shift()
    }

    // Log slow requests
    if (metrics.duration > 1000) {
      logger.warn('Slow request detected', {
        path: metrics.path,
        method: metrics.method,
        duration: `${metrics.duration}ms`,
      })
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalRequests: number
    averageDuration: number
    slowestRequest: RequestMetrics | null
    errorRate: number
  } {
    if (this.requests.length === 0) {
      return {
        totalRequests: 0,
        averageDuration: 0,
        slowestRequest: null,
        errorRate: 0,
      }
    }

    const totalDuration = this.requests.reduce((sum, req) => sum + req.duration, 0)
    const errorCount = this.requests.filter(req => req.statusCode >= 400).length
    const slowest = this.requests.reduce((slowest, req) => 
      req.duration > slowest.duration ? req : slowest
    )

    return {
      totalRequests: this.requests.length,
      averageDuration: Math.round(totalDuration / this.requests.length),
      slowestRequest: slowest,
      errorRate: (errorCount / this.requests.length) * 100,
    }
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.requests = []
  }
}

// Singleton metrics collector
export const metricsCollector = new MetricsCollector()
