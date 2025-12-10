import { generateId } from '@/services/storage'

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  context?: any
}

class Logger {
  private logs: LogEntry[] = []
  private listeners: ((logs: LogEntry[]) => void)[] = []
  private maxLogs = 1000

  log(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    }

    this.logs.unshift(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.pop()
    }

    this.notifyListeners()

    // Also log to console for development visibility
    if (level === 'ERROR') console.error(`[${level}] ${message}`, context)
    else if (level === 'WARN') console.warn(`[${level}] ${message}`, context)
    // else console.log(`[${level}] ${message}`, context)
  }

  debug(message: string, context?: any) {
    this.log('DEBUG', message, context)
  }
  info(message: string, context?: any) {
    this.log('INFO', message, context)
  }
  warn(message: string, context?: any) {
    this.log('WARN', message, context)
  }
  error(message: string, context?: any) {
    this.log('ERROR', message, context)
  }

  getLogs() {
    return this.logs
  }

  clear() {
    this.logs = []
    this.notifyListeners()
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l(this.logs))
  }
}

export const logger = new Logger()
