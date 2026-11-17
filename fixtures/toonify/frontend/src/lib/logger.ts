/**
 * Structured Logging for Google Cloud Logging (Frontend)
 * 
 * This module provides structured logging that outputs JSON-formatted logs
 * compatible with Google Cloud Logging via Next.js runtime.
 * 
 * Features:
 * - Automatic trace ID propagation
 * - Standardized log attributes
 * - Request context correlation
 * - Severity level mapping
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface LogContext {
  traceId?: string;
  spanId?: string;
  requestId?: string;
  userId?: string;
  component?: string;
  [key: string]: unknown;
}

interface StructuredLog {
  severity: LogLevel;
  message: string;
  timestamp: string;
  'logging.googleapis.com/labels'?: Record<string, string>;
  'logging.googleapis.com/trace'?: string;
  'logging.googleapis.com/spanId'?: string;
  jsonPayload?: Record<string, unknown>;
  sourceLocation?: {
    file?: string;
    function?: string;
  };
}

// Global context storage
let globalContext: LogContext = {};

/**
 * Set global context that will be included in all logs
 */
export function setLogContext(context: Partial<LogContext>): void {
  globalContext = { ...globalContext, ...context };
}

/**
 * Clear global context
 */
export function clearLogContext(): void {
  globalContext = {};
}

/**
 * Get the current trace ID from context or generate one
 */
export function getTraceId(): string {
  if (globalContext.traceId) {
    return globalContext.traceId;
  }
  // Generate a simple trace ID if none exists
  return `frontend-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Set trace ID in context
 */
export function setTraceId(traceId: string): void {
  globalContext.traceId = traceId;
}

/**
 * Format a structured log entry for Google Cloud Logging
 */
function formatLogEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
  error?: Error
): StructuredLog {
  const entry: StructuredLog = {
    severity: level,
    message,
    timestamp: new Date().toISOString(),
  };

  // Add labels
  const labels: Record<string, string> = {
    source: 'frontend',
  };

  if (globalContext.component) {
    labels.component = globalContext.component;
  }

  if (globalContext.userId) {
    labels.user_id = globalContext.userId;
  }

  if (globalContext.requestId) {
    labels.request_id = globalContext.requestId;
  }

  entry['logging.googleapis.com/labels'] = labels;

  // Add trace context
  if (globalContext.traceId) {
    entry['logging.googleapis.com/trace'] = globalContext.traceId;
  }

  if (globalContext.spanId) {
    entry['logging.googleapis.com/spanId'] = globalContext.spanId;
  }

  // Add extra data as JSON payload
  if (data || error) {
    entry.jsonPayload = {
      ...data,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };
  }

  return entry;
}

/**
 * Check if we're in production (Cloud Run)
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Output log entry - JSON in production, formatted in development
 */
function outputLog(entry: StructuredLog): void {
  if (isProduction()) {
    // In production, output structured JSON for Cloud Logging
    const logMethod = entry.severity === 'ERROR' || entry.severity === 'CRITICAL' 
      ? console.error 
      : entry.severity === 'WARNING' 
        ? console.warn 
        : console.log;
    logMethod(JSON.stringify(entry));
  } else {
    // In development, output human-readable logs
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const prefix = `[${timestamp}] [${entry.severity}]`;
    const labels = entry['logging.googleapis.com/labels'];
    const component = labels?.component ? `[${labels.component}]` : '';
    
    const logMethod = entry.severity === 'ERROR' || entry.severity === 'CRITICAL' 
      ? console.error 
      : entry.severity === 'WARNING' 
        ? console.warn 
        : entry.severity === 'DEBUG'
          ? console.debug
          : console.log;
    
    if (entry.jsonPayload) {
      logMethod(`${prefix}${component} ${entry.message}`, entry.jsonPayload);
    } else {
      logMethod(`${prefix}${component} ${entry.message}`);
    }
  }
}

/**
 * Logger class for structured logging
 */
class Logger {
  private component: string;

  constructor(component: string) {
    this.component = component;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
    // Skip debug logs in production unless explicitly enabled
    if (level === 'DEBUG' && isProduction() && !process.env.NEXT_PUBLIC_DEBUG_LOGS) {
      return;
    }

    const savedComponent = globalContext.component;
    globalContext.component = this.component;
    
    const entry = formatLogEntry(level, message, data, error);
    outputLog(entry);
    
    globalContext.component = savedComponent;
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('DEBUG', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('WARNING', message, data);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : undefined;
    const extraData = error instanceof Error ? data : { ...(error as Record<string, unknown>), ...data };
    this.log('ERROR', message, extraData, errorObj);
  }

  critical(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errorObj = error instanceof Error ? error : undefined;
    const extraData = error instanceof Error ? data : { ...(error as Record<string, unknown>), ...data };
    this.log('CRITICAL', message, extraData, errorObj);
  }
}

/**
 * Create a logger instance for a specific component
 */
export function createLogger(component: string): Logger {
  return new Logger(component);
}

/**
 * Default logger for quick use
 */
export const logger = createLogger('app');

export default logger;
