import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (name: string, email: string, pass: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await api.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Failed to restore session:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const login = async (email: string, pass: string) => {
    setIsLoading(true)
    try {
      const user = await api.login(email, pass)
      setUser(user)
      toast({
        title: 'Bem-vindo de volta!',
        description: `Login realizado como ${user.name}`,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description:
          error instanceof Error ? error.message : 'Falha ao autenticar.',
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true)
    try {
      const user = await api.register(name, email, pass)
      setUser(user)
      toast({
        title: 'Conta criada!',
        description: 'Seu cadastro foi realizado com sucesso.',
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro no cadastro',
        description:
          error instanceof Error ? error.message : 'Falha ao criar conta.',
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.logout()
      setUser(null)
      toast({
        title: 'Até logo!',
        description: 'Você foi desconectado.',
      })
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
