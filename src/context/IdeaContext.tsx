import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { Idea, Tag, IdeaTimelineEvent } from '@/types'
import { ideaService } from '@/services/ideaService'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'

interface IdeaContextType {
  ideas: Idea[]
  tags: Tag[]
  isLoading: boolean
  addIdea: (
    idea: Omit<
      Idea,
      'id' | 'createdAt' | 'updatedAt' | 'priorityScore' | 'userId'
    >,
  ) => Promise<void>
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>
  refreshIdeas: () => Promise<void>
  createTag: (name: string) => Promise<Tag>
  getEvents: (ideaId: string) => Promise<IdeaTimelineEvent[]>
}

const IdeaContext = createContext<IdeaContextType | undefined>(undefined)

export const IdeaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    if (!user) {
      setIdeas([])
      setTags([])
      setIsLoading(false)
      return
    }

    try {
      const [fetchedIdeas, fetchedTags] = await Promise.all([
        ideaService.getIdeas(user.id),
        ideaService.getTags(),
      ])
      setIdeas(fetchedIdeas)
      setTags(fetchedTags)
    } catch (error) {
      console.error('Failed to load data', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: 'Não foi possível conectar ao servidor.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addIdea = useCallback(
    async (
      newIdea: Omit<
        Idea,
        'id' | 'createdAt' | 'updatedAt' | 'priorityScore' | 'userId'
      >,
    ) => {
      if (!user) return

      try {
        const created = await ideaService.createIdea({
          ...newIdea,
          userId: user.id,
        })
        setIdeas((prev) => [created, ...prev])
        toast({
          title: 'Ideia criada!',
          description: 'Sua ideia foi salva com sucesso.',
        })
      } catch (error) {
        console.error(error)
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Falha ao criar ideia.',
        })
      }
    },
    [toast, user],
  )

  const updateIdea = useCallback(
    async (id: string, updates: Partial<Idea>) => {
      try {
        // Optimistic update
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === id
              ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
              : idea,
          ),
        )

        const updated = await ideaService.updateIdea(id, updates)

        // Reconcile with server response (important for calculated fields like priorityScore)
        setIdeas((prev) =>
          prev.map((idea) => (idea.id === id ? updated : idea)),
        )
      } catch (error) {
        console.error(error)
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Falha ao atualizar ideia.',
        })
        loadData() // Revert on error
      }
    },
    [loadData, toast],
  )

  const createTag = useCallback(
    async (name: string) => {
      try {
        const newTag = await ideaService.createTag(name)
        // Check if tag already exists in state to avoid duplicates
        setTags((prev) => {
          if (!prev.some((t) => t.id === newTag.id)) {
            return [...prev, newTag]
          }
          return prev
        })
        return newTag
      } catch (error) {
        console.error(error)
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Falha ao criar tag.',
        })
        throw error
      }
    },
    [toast],
  )

  const getEvents = useCallback(async (ideaId: string) => {
    return ideaService.getTimelineEvents(ideaId)
  }, [])

  return (
    <IdeaContext.Provider
      value={{
        ideas,
        tags,
        isLoading,
        addIdea,
        updateIdea,
        refreshIdeas: loadData,
        createTag,
        getEvents,
      }}
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
