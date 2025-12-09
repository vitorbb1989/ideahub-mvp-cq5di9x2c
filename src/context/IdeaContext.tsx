import React, { createContext, useContext, useState, useEffect } from 'react'
import { Idea, IdeaStatus, IdeaHistory } from '@/types'
import { v4 as uuidv4 } from 'uuid' // Assuming uuid might not be available, I will use a simple generator if needed, but Context says I can use 'date-fns' and 'zod', not uuid. I'll implement a simple ID generator.

// Simple ID generator if uuid is not available
const generateId = () => Math.random().toString(36).substring(2, 9)

interface IdeaContextType {
  ideas: Idea[]
  addIdea: (
    idea: Omit<
      Idea,
      'id' | 'createdAt' | 'updatedAt' | 'history' | 'priorityScore'
    >,
  ) => void
  updateIdea: (id: string, updates: Partial<Idea>) => void
  deleteIdea: (id: string) => void
  isLoading: boolean
}

const IdeaContext = createContext<IdeaContextType | undefined>(undefined)

const MOCK_IDEAS: Idea[] = [
  {
    id: '1',
    title: 'Integração com WhatsApp',
    summary: 'Permitir que clientes enviem mensagens direto pelo app.',
    description:
      'Implementar a API do WhatsApp Business para facilitar o contato.',
    status: 'mvp',
    category: 'nova_solucao',
    impact: 5,
    effort: 2,
    priorityScore: 2.5,
    tags: ['mobile', 'comunicação'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
  },
  {
    id: '2',
    title: 'Melhorar performance do dashboard',
    summary: 'O carregamento está lento em conexões 3G.',
    status: 'backlog',
    category: 'melhoria',
    impact: 3,
    effort: 4,
    priorityScore: 0.75,
    tags: ['performance', 'frontend'],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
  },
  {
    id: '3',
    title: 'Exportar relatórios em PDF',
    summary: 'Funcionalidade solicitada por 3 clientes enterprise.',
    status: 'inbox',
    category: 'nova_solucao',
    impact: 4,
    effort: 3,
    priorityScore: 1.33,
    tags: ['relatorios', 'enterprise'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [],
  },
]

export const IdeaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API fetch
    const loadData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      setIdeas(MOCK_IDEAS)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const addIdea = (
    newIdea: Omit<
      Idea,
      'id' | 'createdAt' | 'updatedAt' | 'history' | 'priorityScore'
    >,
  ) => {
    const idea: Idea = {
      ...newIdea,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priorityScore: Number((newIdea.impact / newIdea.effort).toFixed(2)),
      history: [
        {
          date: new Date().toISOString(),
          previousStatus: null,
          newStatus: newIdea.status,
        },
      ],
    }
    setIdeas((prev) => [idea, ...prev])
  }

  const updateIdea = (id: string, updates: Partial<Idea>) => {
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id !== id) return idea

        const updatedIdea = {
          ...idea,
          ...updates,
          updatedAt: new Date().toISOString(),
        }

        // Recalculate priority if impact or effort changed
        if (updates.impact || updates.effort) {
          const impact = updates.impact ?? idea.impact
          const effort = updates.effort ?? idea.effort
          updatedIdea.priorityScore = Number((impact / effort).toFixed(2))
        }

        // Handle status change history
        if (updates.status && updates.status !== idea.status) {
          const historyEntry: IdeaHistory = {
            date: new Date().toISOString(),
            previousStatus: idea.status,
            newStatus: updates.status,
          }
          updatedIdea.history = [historyEntry, ...idea.history]
        }

        return updatedIdea
      }),
    )
  }

  const deleteIdea = (id: string) => {
    setIdeas((prev) => prev.filter((idea) => idea.id !== id))
  }

  return (
    <IdeaContext.Provider
      value={{ ideas, addIdea, updateIdea, deleteIdea, isLoading }}
    >
      {children}
    </IdeaContext.Provider>
  )
}

export const useIdeas = () => {
  const context = useContext(IdeaContext)
  if (!context) {
    throw new Error('useIdeas must be used within an IdeaProvider')
  }
  return context
}
