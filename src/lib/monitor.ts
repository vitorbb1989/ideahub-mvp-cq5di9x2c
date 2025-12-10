import { logger } from './logger'

export interface MetricPoint {
  time: string
  value: number
}

class MonitorService {
  private metrics = {
    requests: [] as MetricPoint[],
    errors: [] as MetricPoint[],
    latency: [] as MetricPoint[],
  }

  private listeners: (() => void)[] = []

  // Simulated System Health
  private systemHealth = {
    cpu: 0,
    memory: 0,
  }

  constructor() {
    // Start background simulation of system resources
    setInterval(() => this.updateSystemHealth(), 2000)
  }

  recordRequest(latencyMs: number, isError: boolean) {
    const now = new Date().toISOString()

    // Add data points
    this.metrics.requests.push({ time: now, value: 1 })
    this.metrics.latency.push({ time: now, value: latencyMs })
    if (isError) {
      this.metrics.errors.push({ time: now, value: 1 })
    }

    // Keep only last 100 points
    if (this.metrics.requests.length > 100) this.metrics.requests.shift()
    if (this.metrics.latency.length > 100) this.metrics.latency.shift()
    if (this.metrics.errors.length > 100) this.metrics.errors.shift()

    this.checkAlerts(latencyMs, isError)
    this.notifyListeners()
  }

  private updateSystemHealth() {
    // Simulate varying CPU/Memory usage
    this.systemHealth.cpu = 20 + Math.random() * 30 // 20-50% base
    this.systemHealth.memory = 40 + Math.random() * 20 // 40-60% base

    // Spike occasionally
    if (Math.random() > 0.9) this.systemHealth.cpu += 40

    this.notifyListeners()
  }

  private checkAlerts(latency: number, isError: boolean) {
    if (latency > 2000) {
      logger.error('High Latency Alert', { latency: `${latency}ms` })
    }
    if (this.systemHealth.cpu > 80) {
      logger.warn('High CPU Usage Alert', {
        cpu: `${this.systemHealth.cpu.toFixed(1)}%`,
      })
    }
  }

  getMetrics() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      latency: this.metrics.latency,
      system: this.systemHealth,
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l())
  }
}

export const monitorService = new MonitorService()
