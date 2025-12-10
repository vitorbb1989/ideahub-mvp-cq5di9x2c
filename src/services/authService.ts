import { User } from '@/types'
import { STORAGE_KEYS, getStored, setStored, generateId } from './storage'
import { apiCall } from '@/lib/apiMiddleware'

class AuthService {
  async login(email: string, password: string): Promise<User> {
    return apiCall('POST /auth/login', async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      const users = getStored<
        (User & { password: string; createdAt: string })[]
      >(STORAGE_KEYS.USERS, [])
      const user = users.find(
        (u) => u.email === email && u.password === password,
      )

      if (!user) {
        throw new Error('Credenciais inválidas. Verifique seu e-mail e senha.')
      }

      const publicUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      }
      setStored(STORAGE_KEYS.SESSION, publicUser)
      return publicUser
    })
  }

  async register(name: string, email: string, password: string): Promise<User> {
    return apiCall('POST /auth/register', async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      const users = getStored<
        (User & { password: string; createdAt: string })[]
      >(STORAGE_KEYS.USERS, [])

      if (users.some((u) => u.email === email)) {
        throw new Error('Este e-mail já está cadastrado.')
      }

      const newUser = {
        id: generateId(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      }

      users.push(newUser)
      setStored(STORAGE_KEYS.USERS, users)

      const publicUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      }
      setStored(STORAGE_KEYS.SESSION, publicUser)
      return publicUser
    })
  }

  async logout() {
    return apiCall('POST /auth/logout', async () => {
      localStorage.removeItem(STORAGE_KEYS.SESSION)
    })
  }

  async getCurrentUser(): Promise<User | null> {
    return apiCall(
      'GET /auth/me',
      async () => {
        // Simulate network delay for session check
        await new Promise((resolve) => setTimeout(resolve, 200))
        return getStored<User | null>(STORAGE_KEYS.SESSION, null)
      },
      { cacheKey: 'current-user', ttl: 5 },
    )
  }
}

export const authService = new AuthService()
