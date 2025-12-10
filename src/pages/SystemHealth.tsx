import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  ShieldCheck,
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RefreshCw,
} from 'lucide-react'
import {
  diagnosticsService,
  DiagnosticResult,
} from '@/services/diagnosticsService'

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'passed')
    return <CheckCircle2 className="w-5 h-5 text-green-500" />
  if (status === 'warning')
    return <AlertTriangle className="w-5 h-5 text-amber-500" />
  if (status === 'failed') return <XCircle className="w-5 h-5 text-red-500" />
  return <div className="w-5 h-5 rounded-full border-2 border-muted" />
}

const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'passed')
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
        Aprovado
      </Badge>
    )
  if (status === 'warning')
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
        Atenção
      </Badge>
    )
  if (status === 'failed')
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
        Falha
      </Badge>
    )
  return <Badge variant="outline">Pendente</Badge>
}

export default function SystemHealth() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setProgress(10)
    setResults([])

    // Simulate steps for UX
    setTimeout(() => setProgress(30), 500)
    setTimeout(() => setProgress(60), 1000)

    try {
      const data = await diagnosticsService.runAll()
      setTimeout(() => {
        setResults(data)
        setProgress(100)
        setIsRunning(false)
      }, 1500)
    } catch (e) {
      console.error(e)
      setIsRunning(false)
    }
  }

  useEffect(() => {
    // Auto-run on mount
    runDiagnostics()
  }, [])

  const getResult = (category: string) =>
    results.find((r) => r.category === category)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground">
            Painel de diagnóstico e validação do backend (serviços).
          </p>
        </div>
        <Button onClick={runDiagnostics} disabled={isRunning} className="gap-2">
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          Executar Diagnóstico
        </Button>
      </div>

      {isRunning && <Progress value={progress} className="h-1" />}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Architecture */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Arquitetura Backend
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold">Mock Service</span>
              {getResult('architecture') && (
                <StatusBadge status={getResult('architecture')!.status} />
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Verificação da estrutura de serviços e persistência.
            </p>
            {getResult('architecture')?.details && (
              <div className="space-y-2 text-sm bg-muted/20 p-3 rounded-md border">
                {Object.entries(getResult('architecture')!.details).map(
                  ([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="capitalize text-muted-foreground">
                        {k}:
                      </span>
                      <span className="font-mono text-xs">
                        {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Auditoria de Segurança
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold">Access Control</span>
              {getResult('security') && (
                <StatusBadge status={getResult('security')!.status} />
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Verificação de criptografia e permissões de acesso.
            </p>
            {getResult('security')?.details && (
              <ul className="space-y-1 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                {(getResult('security')!.details as string[]).map((msg, i) => (
                  <li key={i} className="flex gap-2">
                    • {msg}
                  </li>
                ))}
                {(getResult('security')!.details as string[]).length === 0 && (
                  <li className="text-green-600">Nenhum problema detectado.</li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Performance</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold">API Response</span>
              {getResult('performance') && (
                <StatusBadge status={getResult('performance')!.status} />
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {getResult('performance')?.message || 'Aguardando teste...'}
            </p>
            {getResult('performance')?.details && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/20 p-2 rounded border text-center">
                  <div className="text-xs text-muted-foreground">Read Time</div>
                  <div className="font-bold">
                    {getResult('performance')!.details.readTimeMs}ms
                  </div>
                </div>
                <div className="bg-muted/20 p-2 rounded border text-center">
                  <div className="text-xs text-muted-foreground">Data Size</div>
                  <div className="font-bold">
                    {(
                      getResult('performance')!.details.dataSizeBytes / 1024
                    ).toFixed(2)}{' '}
                    KB
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Integrity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              Integridade de Dados
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold">Schema Check</span>
              {getResult('integrity') && (
                <StatusBadge status={getResult('integrity')!.status} />
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {getResult('integrity')?.message || 'Verificando integridade...'}
            </p>
            {getResult('integrity')?.details &&
              (getResult('integrity')!.details as string[]).length > 0 && (
                <div className="max-h-24 overflow-y-auto text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                  {(getResult('integrity')!.details as string[]).map(
                    (msg, i) => (
                      <div key={i}>• {msg}</div>
                    ),
                  )}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
