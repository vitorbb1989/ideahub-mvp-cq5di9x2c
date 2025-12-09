import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  History,
  Mail,
  Lock,
  User as UserIcon,
  Trash2,
  Upload,
  FileText,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { UserActivity, UserActivityType } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ActivityHistoryProps {
  userId: string
  refreshTrigger: number
}

const getActivityIcon = (type: UserActivityType) => {
  switch (type) {
    case 'EMAIL_UPDATE':
      return <Mail className="w-4 h-4 text-blue-500" />
    case 'PASSWORD_CHANGE':
      return <Lock className="w-4 h-4 text-orange-500" />
    case 'AVATAR_UPLOAD':
      return <Upload className="w-4 h-4 text-green-500" />
    case 'AVATAR_REMOVE':
      return <Trash2 className="w-4 h-4 text-red-500" />
    case 'NAME_UPDATE':
      return <UserIcon className="w-4 h-4 text-purple-500" />
    default:
      return <FileText className="w-4 h-4 text-gray-500" />
  }
}

const getActivityTitle = (type: UserActivityType) => {
  switch (type) {
    case 'EMAIL_UPDATE':
      return 'E-mail Atualizado'
    case 'PASSWORD_CHANGE':
      return 'Senha Alterada'
    case 'AVATAR_UPLOAD':
      return 'Foto de Perfil Atualizada'
    case 'AVATAR_REMOVE':
      return 'Foto de Perfil Removida'
    case 'NAME_UPDATE':
      return 'Nome Atualizado'
    default:
      return 'Alteração de Perfil'
  }
}

export function ActivityHistory({
  userId,
  refreshTrigger,
}: ActivityHistoryProps) {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true)
      try {
        const data = await api.getUserActivities(userId)
        setActivities(data)
      } catch (error) {
        console.error('Failed to load activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchActivities()
    }
  }, [userId, refreshTrigger])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <CardTitle>Histórico de Atividades</CardTitle>
        </div>
        <CardDescription>
          Registro de alterações feitas na sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma atividade encontrada.</p>
          </div>
        ) : (
          <div className="relative space-y-6 pl-4">
            <div className="absolute left-1 top-2 bottom-2 w-px bg-border md:left-2.5" />
            {activities.map((activity) => (
              <div key={activity.id} className="relative pl-6 md:pl-8">
                {/* Timeline dot */}
                <div className="absolute left-[-5px] md:left-0 top-1.5 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-background border border-border shadow-sm z-10">
                  <div className="h-2 w-2 rounded-full bg-primary/20" />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {getActivityIcon(activity.type)}
                    <span className="font-medium text-sm">
                      {getActivityTitle(activity.type)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(activity.date), "d 'de' MMM, HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {activity.details && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/50">
                      {activity.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
