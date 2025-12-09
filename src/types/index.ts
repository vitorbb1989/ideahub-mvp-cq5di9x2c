export type IdeaStatus =
  | 'inbox'
  | 'nova_ideia'
  | 'em_analise'
  | 'mvp'
  | 'backlog'
  | 'em_andamento'
  | 'entregue'
  | 'arquivada'

export type IdeaCategory =
  | 'nova_solucao'
  | 'solucao_em_andamento'
  | 'melhoria'
  | 'experimento'

export interface IdeaHistory {
  date: string
  previousStatus: IdeaStatus | null
  newStatus: IdeaStatus
}

export interface Idea {
  id: string
  title: string
  summary?: string
  description?: string
  status: IdeaStatus
  category: IdeaCategory
  impact: number // 1-5
  effort: number // 1-5
  priorityScore: number // Calculated: impact / effort
  tags: string[]
  createdAt: string
  updatedAt: string
  history: IdeaHistory[]
}

export const STATUS_LABELS: Record<IdeaStatus, string> = {
  inbox: 'Inbox',
  nova_ideia: 'Nova Ideia',
  em_analise: 'Em Análise',
  mvp: 'MVP',
  backlog: 'Backlog',
  em_andamento: 'Em Andamento',
  entregue: 'Entregue',
  arquivada: 'Arquivada',
}

export const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  nova_solucao: 'Nova Solução',
  solucao_em_andamento: 'Solução em Andamento',
  melhoria: 'Melhoria',
  experimento: 'Experimento',
}
