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

export interface User {
  id: string
  name: string
  email: string
  avatar?: string | null
}

export interface Tag {
  id: string
  name: string
  color?: string
}

export type UserActivityType =
  | 'EMAIL_UPDATE'
  | 'PASSWORD_CHANGE'
  | 'AVATAR_UPLOAD'
  | 'AVATAR_REMOVE'
  | 'NAME_UPDATE'

export interface UserActivity {
  id: string
  userId: string
  type: UserActivityType
  details?: string
  date: string
}

export interface Idea {
  id: string
  userId: string
  title: string
  summary: string
  description?: string
  status: IdeaStatus
  category: IdeaCategory
  impact: number // 1-5
  effort: number // 1-5
  priorityScore: number // Calculated: impact / effort
  tags: Tag[]
  createdAt: string
  updatedAt: string
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

// Continuity Features Types

export interface IdeaLastState {
  whereIStopped: string
  whatIWasDoing: string
  nextStep: string
  updatedAt: string
}

export interface IdeaChecklistItem {
  id: string
  label: string
  done: boolean
}

export interface IdeaReferenceLink {
  id: string
  title: string
  url: string
}

export interface IdeaSnapshot {
  id: string
  title: string
  createdAt: string
  data: {
    ideaTitle: string
    ideaSummary: string
    lastState: IdeaLastState | null
    checklist: IdeaChecklistItem[]
    references: IdeaReferenceLink[]
  }
}

export type IdeaTimelineEventType =
  | 'status_changed'
  | 'last_state_updated'
  | 'checklist_updated'
  | 'references_updated'
  | 'snapshot_created'
  | 'priority_updated'
  | 'tags_updated'

export interface IdeaTimelineEvent {
  id: string
  type: IdeaTimelineEventType
  createdAt: string
  payload?: Record<string, any>
}
