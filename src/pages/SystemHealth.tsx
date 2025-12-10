import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  Server,
  AlertTriangle,
  Zap,
  Terminal,
  Cpu,
  RefreshCw,
} from 'lucide-react'
import { monitorService, MetricPoint } from '@/lib/monitor'
import { logger, LogEntry } from '@/lib/logger'
import { cacheService } from '@/lib/cache'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function SystemHealth() {
  const [metrics, setMetrics] = useState(monitorService.getMetrics())
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [cacheStats, setCacheStats] = useState(cacheService.getStats())
  const [activeTab, setActiveTab] = useState<'monitor' | 'logs'>('monitor')

  useEffect(() => {
    // Initial fetch
    setLogs(logger.getLogs())

    // Subscriptions
    const unsubMetrics = monitorService.subscribe(() => {
      setMetrics({ ...monitorService.getMetrics() })
    })

    const unsubLogs = logger.subscribe((newLogs) => {
      setLogs([...newLogs])
    })

    // Interval for Cache stats
    const interval = setInterval(() => {
      setCacheStats(cacheService.getStats())
    }, 2000)

    return () => {
      unsubMetrics()
      unsubLogs()
      clearInterval(interval)
    }
  }, [])

  const chartConfig = {
    latency: {
      label: 'Latency (ms)',
      color: 'hsl(var(--chart-1))',
    },
    requests: {
      label: 'Requests',
      color: 'hsl(var(--chart-2))',
    },
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground">
            Painel de monitoramento em tempo real e infraestrutura simulada.
          </p>
        </div>
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('monitor')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'monitor'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monitoramento
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              activeTab === 'logs'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Logs do Sistema
          </button>
        </div>
      </div>

      {activeTab === 'monitor' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Top Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.system.cpu.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Simulated load</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.system.memory.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Simulated utilization
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit</CardTitle>
                <Zap className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(cacheStats.hitRatio * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {cacheStats.hits} hits / {cacheStats.misses} misses
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Errors (1m)
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.errors.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 100 requests
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>API Latency</CardTitle>
                <CardDescription>Response time in milliseconds</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px]">
                <ChartContainer config={chartConfig}>
                  <LineChart data={metrics.latency}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={() => ''}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}ms`}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Line
                      dataKey="value"
                      type="monotone"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Requests Throughput</CardTitle>
                <CardDescription>
                  Requests per second event stream
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 min-h-[300px]">
                <ChartContainer config={chartConfig}>
                  <LineChart data={metrics.requests}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={() => ''}
                    />
                    <YAxis tickLine={false} axisLine={false} />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Line
                      dataKey="value"
                      type="step"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="flex-1 animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                System Logs
              </CardTitle>
              <CardDescription>
                Live stream of backend events, errors, and warnings.
              </CardDescription>
            </div>
            <button
              onClick={() => logger.clear()}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Clear
            </button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full rounded-md border bg-zinc-950 p-4 font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-zinc-500 italic">No logs available...</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-2 hover:bg-white/5 p-0.5 rounded"
                    >
                      <span className="text-zinc-500 shrink-0">
                        [{log.timestamp.split('T')[1].split('.')[0]}]
                      </span>
                      <span
                        className={`font-bold shrink-0 w-14 ${
                          log.level === 'ERROR'
                            ? 'text-red-500'
                            : log.level === 'WARN'
                              ? 'text-yellow-500'
                              : log.level === 'INFO'
                                ? 'text-blue-400'
                                : 'text-zinc-400'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-zinc-300 break-all">
                        {log.message}
                      </span>
                      {log.context && (
                        <span className="text-zinc-600 hidden md:inline-block">
                          {JSON.stringify(log.context)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
