import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileCode,
  Layers,
  Shield,
  Database,
  LayoutTemplate,
} from 'lucide-react'

export default function Documentation() {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 pb-10 max-w-5xl mx-auto">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">
            Documentação Técnica
          </h2>
          <p className="text-muted-foreground">
            Visão detalhada da arquitetura, funcionalidades e estrutura do
            sistema.
          </p>
        </div>
        <Separator className="my-6" />

        {/* Arquitetura */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold tracking-tight">
              Arquitetura da Aplicação
            </h3>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stack Tecnológico</CardTitle>
              <CardDescription>
                Fundamentos técnicos utilizados no desenvolvimento do MVP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React 18</Badge>
                <Badge variant="secondary">Vite</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Tailwind CSS</Badge>
                <Badge variant="secondary">Shadcn/ui</Badge>
                <Badge variant="secondary">React Router DOM</Badge>
                <Badge variant="secondary">React Hook Form</Badge>
                <Badge variant="secondary">Zod</Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A aplicação é construída como uma Single Page Application (SPA)
                utilizando React com Vite para alta performance e
                desenvolvimento ágil. A estilização é baseada em utilitários com
                Tailwind CSS e componentes acessíveis do Radix UI via shadcn/ui.
                O gerenciamento de estado é realizado primariamente através da
                Context API do React, segregando contextos de Autenticação e
                Dados de Negócio (Ideias).
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Funcionalidades */}
        <section className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold tracking-tight">
              Funcionalidades Implementadas
            </h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Autenticação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sistema completo de autenticação gerenciado pelo{' '}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    AuthContext
                  </code>
                  . Inclui login, registro de novos usuários e persistência de
                  sessão utilizando LocalStorage para simular tokens. O acesso a
                  rotas protegidas é controlado por componentes de Higher-Order
                  (Protected Routes).
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Gestão de Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Permite aos usuários atualizar informações cadastrais (nome e
                  e-mail) e alterar a senha de acesso. As validações são feitas
                  via Zod schemas, garantindo integridade dos dados antes do
                  envio para a API simulada.
                </p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Gestão de Avatar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Funcionalidade implementada no componente{' '}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    AvatarUpload
                  </code>
                  . Permite o upload de imagens (JPEG, PNG, GIF) que são
                  convertidas para Base64 no cliente e armazenadas no perfil do
                  usuário. Inclui validação de tipo de arquivo e tamanho máximo
                  (5MB).
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Comunicação e Dados */}
        <section className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold tracking-tight">
              Comunicação e Fluxo de Dados
            </h3>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">State Management</h4>
                  <p className="text-sm text-muted-foreground">
                    O estado global é dividido em contextos temáticos. O{' '}
                    <strong>AuthContext</strong> provê o objeto `user` e métodos
                    de autenticação para toda a árvore de componentes. O{' '}
                    <strong>IdeaContext</strong> gerencia as coleções de ideias,
                    tags e operações de CRUD, expondo hooks customizados
                    (`useAuth`, `useIdeas`) para consumo fácil.
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-1">Mock API Layer</h4>
                  <p className="text-sm text-muted-foreground">
                    Para este MVP, não há backend real. A comunicação é feita
                    através de uma camada de serviço (`src/lib/api.ts`) que
                    simula chamadas assíncronas (com delay artificial) e utiliza
                    o `localStorage` do navegador como banco de dados
                    persistente. Isso permite que a aplicação funcione
                    end-to-end sem infraestrutura de servidor.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Estrutura de Arquivos */}
        <section className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold tracking-tight">
              Estrutura de Arquivos Chave
            </h3>
          </div>
          <div className="grid gap-4">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  <div className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-[200px] font-mono text-sm font-semibold text-primary">
                      src/types/index.ts
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Define as interfaces TypeScript globais como `User`,
                      `Idea`, `Tag` e `IdeaEvent`, garantindo tipagem forte em
                      toda a aplicação.
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-[200px] font-mono text-sm font-semibold text-primary">
                      src/lib/api.ts
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Contém a classe `MockApi` que simula endpoints REST.
                      Gerencia leitura/escrita no LocalStorage e introduz
                      latência para simular rede real.
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-[200px] font-mono text-sm font-semibold text-primary">
                      src/context/AuthContext.tsx
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Context Provider responsável por manter o estado da sessão
                      do usuário e expor métodos `login`, `register`, `logout` e
                      `updateProfile`.
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-[200px] font-mono text-sm font-semibold text-primary">
                      src/components/AvatarUpload.tsx
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Componente isolado para tratamento de upload de imagem de
                      perfil, com pré-visualização e conversão para Base64.
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-[200px] font-mono text-sm font-semibold text-primary">
                      src/components/Sidebar.tsx
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Componente de navegação principal. Responsivo, exibe links
                      com base nas rotas e informações resumidas do usuário
                      logado.
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-[200px] font-mono text-sm font-semibold text-primary">
                      src/pages/Profile.tsx
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Página que orquestra a edição de dados do usuário. Integra
                      `AvatarUpload` e formulários `react-hook-form` para
                      alteração de senha e dados cadastrais.
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-[200px] font-mono text-sm font-semibold text-primary">
                      src/pages/Login.tsx / Register.tsx
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Páginas públicas de autenticação. Utilizam o hook
                      `useAuth` para interagir com o contexto de autenticação e
                      redirecionar o usuário após sucesso.
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="min-w-[200px] font-mono text-sm font-semibold text-primary">
                      src/App.tsx
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ponto de entrada da aplicação. Configura o roteamento,
                      providers globais (Toast, Auth) e define a estrutura de
                      rotas públicas vs. protegidas.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Layout Interaction */}
        <section className="space-y-4 mt-8">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold tracking-tight">
              Interação de Layout
            </h3>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                O layout da aplicação utiliza um padrão de "Shell" onde o{' '}
                <strong>Sidebar</strong> e o <strong>Header</strong> são
                persistentes nas rotas autenticadas. O conteúdo da página é
                renderizado através do componente `Outlet` do React Router
                dentro de uma área de scroll principal, garantindo que a
                navegação permaneça acessível.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </ScrollArea>
  )
}
