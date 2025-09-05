import {
  EditorLogEntry,
  LogLevel,
  LogCategory,
  PerformanceMetrics,
  EditorPerformanceTracker
} from '@/types/editor.types'

/**
 * Production-ready logging service for editor operations
 * Provides structured logging, performance tracking, and error monitoring
 */
export class LoggingService {
  private static logs: EditorLogEntry[] = []
  private static maxLogSize = 1000
  private static isProduction = import.meta.env?.MODE === 'production' || false
  private static enabledLevels: Set<LogLevel> = new Set(['error', 'warn', 'info', 'debug'])

  /**
   * Log debug message
   */
  public static debug(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log('debug', category, message, data)
  }

  /**
   * Log info message
   */
  public static info(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log('info', category, message, data)
  }

  /**
   * Log warning message
   */
  public static warn(category: LogCategory, message: string, data?: Record<string, unknown>): void {
    this.log('warn', category, message, data)
  }

  /**
   * Log error message
   */
  public static error(category: LogCategory, message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log('error', category, message, data, error)
  }

  /**
   * Core logging method
   */
  private static log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.enabledLevels.has(level)) {
      return
    }

    const logEntry: EditorLogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      error
    }

    // Add to internal log store
    this.addToLogStore(logEntry)

    // Console output in development
    if (!this.isProduction) {
      this.outputToConsole(logEntry)
    }

    // Send to external monitoring in production
    if (this.isProduction && (level === 'error' || level === 'warn')) {
      this.sendToMonitoring(logEntry)
    }
  }

  /**
   * Add log entry to internal store
   */
  private static addToLogStore(entry: EditorLogEntry): void {
    this.logs.push(entry)
    
    // Trim logs if exceeding max size
    if (this.logs.length > this.maxLogSize) {
      this.logs = this.logs.slice(-this.maxLogSize)
    }
  }

  /**
   * Output to console with formatting
   */
  private static outputToConsole(entry: EditorLogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`
    
    const consoleMethod = this.getConsoleMethod(entry.level)
    
    if (entry.error) {
      consoleMethod(`${prefix} ${entry.message}`, entry.data, entry.error)
    } else if (entry.data) {
      consoleMethod(`${prefix} ${entry.message}`, entry.data)
    } else {
      consoleMethod(`${prefix} ${entry.message}`)
    }
  }

  /**
   * Get appropriate console method
   */
  private static getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case 'error':
        return console.error
      case 'warn':
        return console.warn
      case 'debug':
        return console.debug
      default:
        return console.log
    }
  }

  /**
   * Send to external monitoring service (placeholder)
   */
  private static async sendToMonitoring(entry: EditorLogEntry): Promise<void> {
    try {
      // In production, integrate with services like:
      // - Sentry for error tracking
      // - LogRocket for session replay
      // - DataDog for logging
      // - New Relic for APM
      
      if (typeof window !== 'undefined' && (window as any).gtag) {
        // Example: Send to Google Analytics
        (window as any).gtag('event', 'editor_error', {
          event_category: entry.category,
          event_label: entry.message,
          custom_map: entry.data
        })
      }
    } catch (error) {
      console.error('Failed to send log to monitoring:', error)
    }
  }

  /**
   * Get recent logs
   */
  public static getLogs(
    count?: number,
    level?: LogLevel,
    category?: LogCategory
  ): EditorLogEntry[] {
    let filteredLogs = this.logs

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    if (count) {
      return filteredLogs.slice(-count)
    }

    return filteredLogs
  }

  /**
   * Clear logs
   */
  public static clearLogs(): void {
    this.logs = []
  }

  /**
   * Export logs for debugging
   */
  public static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Configure logging
   */
  public static configure(config: {
    maxLogSize?: number
    enabledLevels?: LogLevel[]
  }): void {
    if (config.maxLogSize) {
      this.maxLogSize = config.maxLogSize
    }
    
    if (config.enabledLevels) {
      this.enabledLevels = new Set(config.enabledLevels)
    }
  }
}

/**
 * Performance tracking service for editor operations
 */
export class PerformanceTracker implements EditorPerformanceTracker {
  private metrics: PerformanceMetrics[] = []
  private readonly maxMetrics = 500

  /**
   * Track operation performance
   */
  public track<T>(operation: string, fn: () => T): T {
    const startTime = performance.now()
    let success = true
    let result: T

    try {
      result = fn()
      return result
    } catch (error) {
      success = false
      throw error
    } finally {
      const endTime = performance.now()
      const duration = endTime - startTime

      const metric: PerformanceMetrics = {
        operationType: this.parseOperationType(operation),
        startTime,
        endTime,
        duration,
        success
      }

      this.addMetric(metric)
      
      // Log slow operations
      if (duration > 100) {
        LoggingService.warn('performance', `Slow operation detected: ${operation}`, {
          duration: `${duration.toFixed(2)}ms`,
          operation
        })
      }
    }
  }

  /**
   * Add performance metric
   */
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric)
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Parse operation type from string
   */
  private parseOperationType(operation: string): PerformanceMetrics['operationType'] {
    if (operation.includes('jsx') || operation.includes('code')) {
      return 'jsx_modification'
    }
    if (operation.includes('dom') || operation.includes('element')) {
      return 'dom_update'
    }
    return 'property_update'
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Get performance statistics
   */
  public getStatistics(): PerformanceStatistics {
    if (this.metrics.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        averageDuration: 0,
        slowestOperation: undefined,
        fastestOperation: undefined
      }
    }

    const successful = this.metrics.filter(m => m.success).length
    const failed = this.metrics.length - successful
    const durations = this.metrics.map(m => m.duration)
    const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length

    const slowest = this.metrics.reduce((prev, current) => 
      current.duration > prev.duration ? current : prev
    )

    const fastest = this.metrics.reduce((prev, current) => 
      current.duration < prev.duration ? current : prev
    )

    return {
      total: this.metrics.length,
      successful,
      failed,
      averageDuration: Number(averageDuration.toFixed(2)),
      slowestOperation: {
        type: slowest.operationType,
        duration: Number(slowest.duration.toFixed(2))
      },
      fastestOperation: {
        type: fastest.operationType,
        duration: Number(fastest.duration.toFixed(2))
      }
    }
  }

  /**
   * Clear metrics
   */
  public clearMetrics(): void {
    this.metrics = []
  }
}

/**
 * Error boundary service for React error handling
 */
export class ErrorBoundaryService {
  /**
   * Handle React error boundary errors
   */
  public static handleError(error: Error, errorInfo: { componentStack: string }): void {
    LoggingService.error('user_interaction', 'React Error Boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })

    // In production, you might want to:
    // 1. Send error to crash reporting service
    // 2. Show user-friendly error message
    // 3. Attempt to recover application state
  }

  /**
   * Handle unhandled promise rejections
   */
  public static handleUnhandledRejection(event: PromiseRejectionEvent): void {
    LoggingService.error('validation', 'Unhandled Promise Rejection', undefined, {
      reason: event.reason,
      type: event.type,
      timestamp: new Date().toISOString()
    })

    // Prevent default browser handling
    event.preventDefault()
  }

  /**
   * Handle global JavaScript errors
   */
  public static handleGlobalError(event: ErrorEvent): void {
    LoggingService.error('validation', 'Global JavaScript Error', undefined, {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Initialize global error handlers
   */
  public static initialize(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
      window.addEventListener('error', this.handleGlobalError)
    }
  }

  /**
   * Cleanup global error handlers
   */
  public static cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
      window.removeEventListener('error', this.handleGlobalError)
    }
  }
}

// ==================== TYPES ====================

interface PerformanceStatistics {
  total: number
  successful: number
  failed: number
  averageDuration: number
  slowestOperation?: {
    type: string
    duration: number
  }
  fastestOperation?: {
    type: string
    duration: number
  }
}

// Global performance tracker instance
export const performanceTracker = new PerformanceTracker()
