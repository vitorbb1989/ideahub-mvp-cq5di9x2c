import { useState, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Activity, Play, StopCircle, Zap, AlertTriangle } from 'lucide-react'
import { ideaService } from '@/services/ideaService'

export default function LoadTest() {
  const [isRunning, setIsRunning] = useState(false)
  const [concurrency, setConcurrency] = useState(5)
  const [stats, setStats] = useState({
    sent: 0,
    success: 0,
    errors: 0,
    avgLatency: 0,
    rateLimited: 0,
  })

  const statsRef = useRef(stats)
  const stopRef = useRef(false)

  const runLoadTest = async () => {
    setIsRunning(true)
    stopRef.current = false
    statsRef.current = {
      sent: 0,
      success: 0,
      errors: 0,
      avgLatency: 0,
      rateLimited: 0,
    }
    setStats(statsRef.current)

    const workers = Array(concurrency)
      .fill(0)
      .map(async (_, i) => {
        while (!stopRef.current) {
          const start = performance.now()
          statsRef.current.sent++

          try {
            // Simulate a read operation (e.g., searching ideas)
            await ideaService.getIdeas('test-user', `load-test-${i}`)

            const latency = performance.now() - start
            statsRef.current.success++
            statsRef.current.avgLatency =
              (statsRef.current.avgLatency * (statsRef.current.success - 1) +
                latency) /
              statsRef.current.success
          } catch (error: any) {
            statsRef.current.errors++
            if (error.message.includes('429')) {
              statsRef.current.rateLimited++
            }
          }

          // Force update UI every 10 requests to avoid lag
          if (statsRef.current.sent % 5 === 0) {
            setStats({ ...statsRef.current })
          }

          // Small delay to prevent browser freeze
          await new Promise((r) => setTimeout(r, 50))
        }
      })

    await Promise.all(workers)
    setIsRunning(false)
    setStats({ ...statsRef.current })
  }

  const stopTest = () => {
    stopRef.current = true
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Load Testing</h2>
        <p className="text-muted-foreground">
          Simulate high traffic to test Rate Limiting and System Stability.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Set parameters for the stress test.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Concurrency (Parallel Requests)</Label>
                  <span className="text-sm text-muted-foreground">
                    {concurrency} threads
                  </span>
                </div>
                <Slider
                  min={1}
                  max={20}
                  step={1}
                  value={[concurrency]}
                  onValueChange={(val) => setConcurrency(val[0])}
                  disabled={isRunning}
                />
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border text-sm text-muted-foreground">
              <p>
                This test will flood the "backend" with read requests. You
                should see the <strong>Rate Limiter</strong> kick in and block
                requests (429 errors) when the limit is exceeded.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            {!isRunning ? (
              <Button onClick={runLoadTest} className="w-full gap-2">
                <Play className="w-4 h-4" /> Start Load Test
              </Button>
            ) : (
              <Button
                onClick={stopTest}
                variant="destructive"
                className="w-full gap-2"
              >
                <StopCircle className="w-4 h-4" /> Stop Test
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Live Results</CardTitle>
            <CardDescription>Real-time performance metrics.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  Total Requests
                </span>
                <div className="text-2xl font-bold">{stats.sent}</div>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  Avg Latency
                </span>
                <div className="text-2xl font-bold">
                  {stats.avgLatency.toFixed(0)}ms
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success Rate</span>
                <span>
                  {stats.sent > 0
                    ? ((stats.success / stats.sent) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{
                    width: `${stats.sent > 0 ? (stats.success / stats.sent) * 100 : 0}%`,
                  }}
                />
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{
                    width: `${stats.sent > 0 ? (stats.errors / stats.sent) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <div className="text-sm">
                  <span className="font-bold">{stats.success}</span> OK
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <div className="text-sm">
                  <span className="font-bold">{stats.errors}</span> Errors
                </div>
              </div>
            </div>

            {stats.rateLimited > 0 && (
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 p-3 rounded-md text-sm border border-orange-200 dark:border-orange-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  Rate Limit Hit: {stats.rateLimited} requests blocked.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
