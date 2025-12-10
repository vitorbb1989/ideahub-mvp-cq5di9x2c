import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, User, Lock } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { AvatarUpload } from '@/components/AvatarUpload'
import { ActivityHistory } from '@/components/ActivityHistory'

// Schema for Profile Info
const profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
})

// Schema for Password Change
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'A senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmNewPassword'],
  })

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth()
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [activityRefreshKey, setActivityRefreshKey] = useState(0)

  // Profile Form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  })

  // Password Form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  })

  const refreshActivity = () => {
    setActivityRefreshKey((prev) => prev + 1)
  }

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    setIsProfileLoading(true)
    try {
      await updateProfile(values)
      refreshActivity()
      // No need to reset form values as they are now the current values
    } catch (error) {
      // Error handled in context
    } finally {
      setIsProfileLoading(false)
    }
  }

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    setIsPasswordLoading(true)
    try {
      await changePassword(values.currentPassword, values.newPassword)
      passwordForm.reset()
      refreshActivity()
    } catch (error) {
      // Error handled in context
    } finally {
      setIsPasswordLoading(false)
    }
  }

  const handleAvatarUpdate = async (avatar: string | null) => {
    await updateProfile({ avatar })
    refreshActivity()
  }

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">
          Configurações de Perfil
        </h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações de segurança.
        </p>
      </div>

      <Separator className="my-6" />

      {/* Avatar Management */}
      <AvatarUpload user={user} onUpdate={handleAvatarUpdate} />

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <CardTitle>Informações Pessoais</CardTitle>
          </div>
          <CardDescription>
            Atualize seu nome e endereço de e-mail.
          </CardDescription>
        </CardHeader>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="seu@email.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="bg-muted/30 py-3 flex justify-end">
              <Button type="submit" disabled={isProfileLoading}>
                {isProfileLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Alterações
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <CardTitle>Segurança</CardTitle>
          </div>
          <CardDescription>Altere sua senha de acesso.</CardDescription>
        </CardHeader>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Atual</FormLabel>
                    <FormControl>
                      <Input placeholder="******" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="******"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="******"
                          type="password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 py-3 flex justify-end">
              <Button
                type="submit"
                variant="outline"
                className="border-primary/20 hover:bg-primary/5 hover:text-primary"
                disabled={isPasswordLoading}
              >
                {isPasswordLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Alterar Senha
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Activity History Card */}
      <ActivityHistory userId={user.id} refreshTrigger={activityRefreshKey} />
    </div>
  )
}
