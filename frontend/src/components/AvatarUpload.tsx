import { useState, useRef } from 'react'
import { Loader2, Upload, Trash2, ImageIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { User as UserType } from '@/types'

interface AvatarUploadProps {
  user: UserType
  onUpdate: (avatar: string | null) => Promise<void>
}

export function AvatarUpload({ user, onUpdate }: AvatarUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation: Type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Formato inválido',
        description: 'Por favor, envie uma imagem JPEG, PNG ou GIF.',
      })
      return
    }

    // Validation: Size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é de 5MB.',
      })
      return
    }

    setIsLoading(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        await onUpdate(base64String)
        toast({
          title: 'Foto atualizada',
          description: 'Sua foto de perfil foi alterada com sucesso.',
        })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao processar imagem',
        description: 'Não foi possível carregar a imagem selecionada.',
      })
    } finally {
      setIsLoading(false)
      // Reset input value to allow selecting same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    setIsLoading(true)
    try {
      await onUpdate(null)
      toast({
        title: 'Foto removida',
        description: 'Sua foto de perfil foi removida.',
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao remover foto',
        description: 'Não foi possível remover sua foto de perfil.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <CardTitle>Foto de Perfil</CardTitle>
        </div>
        <CardDescription>Personalize seu perfil com uma foto.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-6">
        <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-sm">
          <AvatarImage src={user.avatar || undefined} alt={user.name} />
          <AvatarFallback className="text-4xl bg-muted">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <div className="flex flex-col gap-1">
            <h3 className="font-medium text-foreground">Sua foto</h3>
            <p className="text-sm text-muted-foreground">
              JPG, PNG ou GIF de até 5MB.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/gif"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Carregar Nova Foto
            </Button>
            {user.avatar && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isLoading}
                onClick={handleRemoveAvatar}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
