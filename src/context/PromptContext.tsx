import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { PromptTemplate } from '@/types'
import { promptService } from '@/services/promptService'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface PromptContextType {
  templates: PromptTemplate[]
  isLoading: boolean
  refreshTemplates: () => Promise<void>
  addTemplate: (data: { title: string; content: string }) => Promise<void>
  updateTemplate: (
    id: string,
    data: { title: string; content: string },
  ) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
}

const PromptContext = createContext<PromptContextType | undefined>(undefined)

export const PromptProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const refreshTemplates = useCallback(async () => {
    if (!user) {
      setTemplates([])
      setIsLoading(false)
      return
    }
    try {
      const data = await promptService.getTemplates(user.id)
      setTemplates(data)
    } catch (error) {
      console.error('Failed to fetch templates', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshTemplates()
  }, [refreshTemplates])

  const addTemplate = async (data: { title: string; content: string }) => {
    if (!user) return
    try {
      await promptService.createTemplate(user.id, data)
      await refreshTemplates()
      toast({ title: 'Sucesso', description: 'Template criado com sucesso.' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao criar template.',
      })
    }
  }

  const updateTemplate = async (
    id: string,
    data: { title: string; content: string },
  ) => {
    try {
      await promptService.updateTemplate(id, data)
      await refreshTemplates()
      toast({
        title: 'Sucesso',
        description: 'Template atualizado com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao atualizar template.',
      })
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      await promptService.deleteTemplate(id)
      await refreshTemplates()
      toast({ title: 'Sucesso', description: 'Template removido.' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao remover template.',
      })
    }
  }

  return (
    <PromptContext.Provider
      value={{
        templates,
        isLoading,
        refreshTemplates,
        addTemplate,
        updateTemplate,
        deleteTemplate,
      }}
    >
      {children}
    </PromptContext.Provider>
  )
}

export const usePrompts = () => {
  const context = useContext(PromptContext)
  if (!context) {
    throw new Error('usePrompts must be used within a PromptProvider')
  }
  return context
}
