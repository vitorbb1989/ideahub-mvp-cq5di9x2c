import { User } from '@/types'
import {
  STORAGE_KEYS,
  getStored,
  setStored,
  delay,
  generateId,
} from './storage'

class AuthService {
  async login(email: string, password: string): Promise<User> {
    await delay(500)
    const users = getStored<(User & { password: string; createdAt: string })[]>(
      STORAGE_KEYS.USERS,
      [],
    )
    const user = users.find((u) => u.email === email && u.password === password)

    if (!user) {
      throw new Error('Credenciais inválidas.')
    }

    const publicUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    }
    setStored(STORAGE_KEYS.SESSION, publicUser)
    return publicUser
  }

  async register(name: string, email: string, password: string): Promise<User> {
    await delay(500)
    const users = getStored<(User & { password: string; createdAt: string })[]>(
      STORAGE_KEYS.USERS,
      [],
    )

    if (users.some((u) => u.email === email)) {
      throw new Error('E-mail já cadastrado.')
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
  }

  async logout() {
    await delay(200)
    localStorage.removeItem(STORAGE_KEYS.SESSION)
  }

  async getCurrentUser(): Promise<User | null> {
    await delay(200)
    return getStored<User | null>(STORAGE_KEYS.SESSION, null)
  }
}

export const authService = new AuthService()
