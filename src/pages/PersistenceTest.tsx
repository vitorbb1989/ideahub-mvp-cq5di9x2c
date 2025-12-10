import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  PlayCircle,
  Terminal,
} from 'lucide-react'
import {
  testIdeaLifecycle,
  testChecklistPersistence,
  testSnapshotPersistence,
  testContinuityPersistence,
  TestLogger,
} from '@/lib/persistenceTests'
import { cn } from '@/lib/utils'

type LogEntry = {
  message: string
  type: 'info' | 'success' | 'error'
  timestamp: string
}
type TestStatus = 'idle' | 'running' | 'success' | 'error'

const StatusIcon = ({ status }: { status: TestStatus }) => {
  if (status === 'running')
    return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
  if (status === 'success')
    return <CheckCircle2 className="w-5 h-5 text-green-500" />
  if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />
  return <div className="w-5 h-5 rounded-full border-2 border-muted" />
}

export default function PersistenceTest() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<Record<string, TestStatus>>({
    lifecycle: 'idle',
    checklist: 'idle',
    snapshot: 'idle',
    continuity: 'idle',
  })

  const addLog: TestLogger = (message, type = 'info') => {
    setLogs((prev) => [
      ...prev,
      { message, type, timestamp: new Date().toLocaleTimeString() },
    ])
  }

  const runTests = async () => {
    setIsRunning(true)
    setLogs([])
    setStatus({
      lifecycle: 'running',
      checklist: 'idle',
      snapshot: 'idle',
      continuity: 'idle',
    })
    addLog('Iniciando bateria de testes de persistência...', 'info')

    try {
      const ideaId = await testIdeaLifecycle(addLog)
      setStatus((p) => ({ ...p, lifecycle: 'success', checklist: 'running' }))

      await testChecklistPersistence(ideaId, addLog)
      setStatus((p) => ({ ...p, checklist: 'success', snapshot: 'running' }))

      await testSnapshotPersistence(ideaId, addLog)
      setStatus((p) => ({ ...p, snapshot: 'success', continuity: 'running' }))

      await testContinuityPersistence(ideaId, addLog)
      setStatus((p) => ({ ...p, continuity: 'success' }))

      addLog('Todos os testes concluídos com sucesso!', 'success')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      addLog(`FALHA CRÍTICA: ${msg}`, 'error')
      setStatus((prev) => {
        const next = { ...prev }
        if (prev.lifecycle === 'running') next.lifecycle = 'error'
        if (prev.checklist === 'running') next.checklist = 'error'
        if (prev.snapshot === 'running') next.snapshot = 'error'
        if (prev.continuity === 'running') next.continuity = 'error'
        return next
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Diagnóstico de Persistência
        </h1>
        <p className="text-muted-foreground">
          Ferramenta de validação de integridade e persistência de dados.
          Execute cenários de teste para verificar se os dados estão sendo
          salvos corretamente.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              Executar Cenários
            </CardTitle>
            <CardDescription>
              Sequência de testes automatizados simulando uso real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { id: 'lifecycle', label: '1. Ciclo de Vida da Ideia' },
                { id: 'checklist', label: '2. Persistência de Checklist' },
                { id: 'snapshot', label: '3. Integridade de Snapshots' },
                { id: 'continuity', label: '4. Continuidade e Referências' },
              ].map((step) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                >
                  <span className="font-medium text-sm">{step.label}</span>
                  <StatusIcon status={status[step.id]} />
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={runTests}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando...
                </>
              ) : (
                'Iniciar Diagnóstico'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col h-[500px]">
          <CardHeader className="pb-3 border-b bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-base font-mono">
              <Terminal className="w-4 h-4" />
              Log de Execução
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden bg-zinc-950">
            <ScrollArea className="h-full p-4 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-zinc-500 italic text-center pt-20">
                  Aguardando início dos testes...
                </div>
              ) : (
                <div className="space-y-1.5">
                  {logs.map((log, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex gap-2',
                        log.type === 'error'
                          ? 'text-red-400 font-bold'
                          : log.type === 'success'
                            ? 'text-green-400'
                            : 'text-zinc-300',
                      )}
                    >
                      <span className="text-zinc-600 shrink-0 select-none">
                        [{log.timestamp}]
                      </span>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
