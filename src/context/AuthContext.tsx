import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'
import { useToast } from '@/hooks/use-toast'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (name: string, email: string, pass: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: {
    name?: string
    email?: string
    avatar?: string | null
  }) => Promise<void>
  changePassword: (currentPass: string, newPass: string) => Promise<void>
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
        const currentUser = await authService.getCurrentUser()
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
      const user = await authService.login(email, pass)
      setUser(user)
      toast({
        title: 'Bem-vindo de volta!',
        description: `Login realizado com sucesso.`,
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
      const user = await authService.register(name, email, pass)
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
      await authService.logout()
      setUser(null)
      toast({
        title: 'Até logo!',
        description: 'Você foi desconectado.',
      })
    } catch (error) {
      console.error(error)
    }
  }

  const updateProfile = async (data: {
    name?: string
    email?: string
    avatar?: string | null
  }) => {
    if (!user) return

    try {
      const updatedUser = await userService.updateProfile(user.id, data)
      setUser(updatedUser)
      // Only show toast for name/email updates, AvatarUpload handles its own feedback
      if (data.name || data.email) {
        toast({
          title: 'Perfil atualizado',
          description: 'Suas informações foram salvas com sucesso.',
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar perfil',
        description:
          error instanceof Error
            ? error.message
            : 'Falha ao atualizar informações.',
      })
      throw error
    }
  }

  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user) return

    try {
      await userService.changePassword(user.id, currentPass, newPass)
      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi atualizada com sucesso.',
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar senha',
        description:
          error instanceof Error ? error.message : 'Falha ao alterar senha.',
      })
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
      }}
    >
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
