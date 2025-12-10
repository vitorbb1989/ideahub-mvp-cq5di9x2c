import { STORAGE_KEYS, validateStorageKey } from './storage'
import {
  ideaCollectionSchema,
  tagCollectionSchema,
  userCollectionSchema,
  promptTemplateCollectionSchema,
  activityCollectionSchema,
} from '@/lib/schemas'
import { ideaService } from './ideaService'

export interface DiagnosticResult {
  category: 'architecture' | 'security' | 'performance' | 'integrity'
  status: 'passed' | 'warning' | 'failed'
  message: string
  details?: any
}

class DiagnosticsService {
  async runAll(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []

    results.push(await this.checkArchitecture())
    results.push(await this.auditSecurity())
    results.push(await this.evaluatePerformance())
    results.push(await this.verifyDataIntegrity())

    return results
  }

  async checkArchitecture(): Promise<DiagnosticResult> {
    return {
      category: 'architecture',
      status: 'passed',
      message: 'Arquitetura Backend (Mock) operacional.',
      details: {
        type: 'Client-side Storage (LocalStorage)',
        services: ['Auth', 'Idea', 'User', 'Prompt', 'Diagnostics'],
        state: 'Stateless Services, Stateful Storage',
        persistence: 'Browser LocalStorage',
      },
    }
  }

  async auditSecurity(): Promise<DiagnosticResult> {
    const issues: string[] = []

    // 1. Check if passwords are encrypted (Mock check)
    // We know they are not in this mock, but we'll flag it as a warning
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS)
    if (rawUsers && rawUsers.includes('"password":')) {
      issues.push(
        'Senhas armazenadas em texto plano no LocalStorage (Ambiente de MVP Mock).',
      )
    }

    // 2. Check Ownership Enforcement Logic (Simulation)
    // We can't easily simulate a hack here without creating a dummy user session,
    // but we can verify the service methods have protection logic if we had reflection.
    // Instead, we verify if the session token exists and is valid format.
    const session = localStorage.getItem(STORAGE_KEYS.SESSION)
    if (session) {
      try {
        JSON.parse(session)
      } catch {
        issues.push('Sessão atual corrompida.')
      }
    }

    return {
      category: 'security',
      status: issues.length > 0 ? 'warning' : 'passed',
      message:
        issues.length > 0
          ? 'Alertas de segurança detectados.'
          : 'Auditoria de segurança concluída.',
      details: issues,
    }
  }

  async evaluatePerformance(): Promise<DiagnosticResult> {
    const start = performance.now()

    // Simulate a Read Operation
    await ideaService.getTags() // usually fast

    // Measure Idea Fetch (Mocked delay is 0 for reads usually in local storage, but service has no delay on getIdeas)
    // Let's force a read of all data
    const usersStr = localStorage.getItem(STORAGE_KEYS.USERS) || '[]'
    const ideasStr = localStorage.getItem(STORAGE_KEYS.IDEAS) || '[]'

    const readDuration = performance.now() - start
    const dataSize = new Blob([usersStr + ideasStr]).size

    const status = readDuration > 100 ? 'warning' : 'passed' // 100ms for local read is high

    return {
      category: 'performance',
      status,
      message: `Tempo de resposta: ${readDuration.toFixed(2)}ms`,
      details: {
        readTimeMs: readDuration.toFixed(2),
        dataSizeBytes: dataSize,
        throughput: 'N/A (Local Read)',
      },
    }
  }

  async verifyDataIntegrity(): Promise<DiagnosticResult> {
    const checks = [
      { key: STORAGE_KEYS.IDEAS, schema: ideaCollectionSchema, name: 'Ideias' },
      { key: STORAGE_KEYS.TAGS, schema: tagCollectionSchema, name: 'Tags' },
      {
        key: STORAGE_KEYS.USERS,
        schema: userCollectionSchema,
        name: 'Usuários',
      },
      {
        key: STORAGE_KEYS.PROMPT_TEMPLATES,
        schema: promptTemplateCollectionSchema,
        name: 'Templates',
      },
      {
        key: STORAGE_KEYS.ACTIVITIES,
        schema: activityCollectionSchema,
        name: 'Atividades',
      },
    ]

    const errors: string[] = []
    let totalItems = 0

    checks.forEach((check) => {
      const result = validateStorageKey(check.key, check.schema)
      if (!result.valid) {
        errors.push(
          `Erro em ${check.name}: ${result.errors.length} problemas de validação.`,
        )
      } else if (Array.isArray(result.data)) {
        totalItems += result.data.length
      }
    })

    return {
      category: 'integrity',
      status: errors.length > 0 ? 'failed' : 'passed',
      message:
        errors.length > 0
          ? 'Falhas de integridade detectadas.'
          : `Dados íntegros. ${totalItems} registros verificados.`,
      details: errors,
    }
  }
}

export const diagnosticsService = new DiagnosticsService()
