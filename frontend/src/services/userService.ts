import { User, UserActivity, UserActivityType } from '@/types'
import { STORAGE_KEYS, getStored, setStored, generateId } from './storage'

class UserService {
  // --- Security Helper ---
  private getCurrentUser(): User | null {
    return getStored<User | null>(STORAGE_KEYS.SESSION, null)
  }

  private checkOwnership(userId: string) {
    const currentUser = this.getCurrentUser()
    if (!currentUser) throw new Error('Usuário não autenticado.')
    if (currentUser.id !== userId)
      throw new Error(
        'Acesso negado: Você não tem permissão para modificar este usuário.',
      )
    return currentUser
  }

  async updateProfile(
    userId: string,
    data: { name?: string; email?: string; avatar?: string | null },
  ): Promise<User> {
    this.checkOwnership(userId)

    const users = getStored<(User & { password: string; createdAt: string })[]>(
      STORAGE_KEYS.USERS,
      [],
    )
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error('Usuário não encontrado.')
    }

    const currentUser = users[index]

    if (data.email && data.email !== currentUser.email) {
      const emailExists = users.some(
        (u) => u.email === data.email && u.id !== userId,
      )
      if (emailExists) {
        throw new Error('Este e-mail já está em uso por outro usuário.')
      }
    }

    if (data.name && data.name !== currentUser.name) {
      this.logUserActivity(
        userId,
        'NAME_UPDATE',
        `Anterior: ${currentUser.name}, Novo: ${data.name}`,
      )
    }

    if (data.email && data.email !== currentUser.email) {
      this.logUserActivity(
        userId,
        'EMAIL_UPDATE',
        `Anterior: ${currentUser.email}, Novo: ${data.email}`,
      )
    }

    if (data.avatar !== undefined && data.avatar !== currentUser.avatar) {
      if (data.avatar === null) {
        this.logUserActivity(userId, 'AVATAR_REMOVE')
      } else {
        this.logUserActivity(userId, 'AVATAR_UPLOAD')
      }
    }

    const updatedUser = { ...currentUser, ...data }
    users[index] = updatedUser
    setStored(STORAGE_KEYS.USERS, users)

    // Update session if it's the current user
    const session = getStored<User | null>(STORAGE_KEYS.SESSION, null)
    if (session && session.id === userId) {
      const publicUser: User = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      }
      setStored(STORAGE_KEYS.SESSION, publicUser)
      return publicUser
    }

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
    }
  }

  async changePassword(
    userId: string,
    currentPass: string,
    newPass: string,
  ): Promise<void> {
    this.checkOwnership(userId)

    const users = getStored<(User & { password: string; createdAt: string })[]>(
      STORAGE_KEYS.USERS,
      [],
    )
    const index = users.findIndex((u) => u.id === userId)

    if (index === -1) {
      throw new Error('Usuário não encontrado.')
    }

    if (users[index].password !== currentPass) {
      throw new Error('A senha atual está incorreta.')
    }

    users[index].password = newPass
    setStored(STORAGE_KEYS.USERS, users)

    this.logUserActivity(userId, 'PASSWORD_CHANGE')
  }

  async getUserActivities(userId: string): Promise<UserActivity[]> {
    // Only allow viewing own activities
    this.checkOwnership(userId)

    const activities = getStored<UserActivity[]>(STORAGE_KEYS.ACTIVITIES, [])
    return activities
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  private logUserActivity(
    userId: string,
    type: UserActivityType,
    details?: string,
  ) {
    const activities = getStored<UserActivity[]>(STORAGE_KEYS.ACTIVITIES, [])
    const newActivity: UserActivity = {
      id: generateId(),
      userId,
      type,
      details,
      date: new Date().toISOString(),
    }
    activities.push(newActivity)
    setStored(STORAGE_KEYS.ACTIVITIES, activities)
  }
}

export const userService = new UserService()
