# IdeaHub MVP

Plataforma completa de gestao de ideias - capture, organize e acompanhe suas ideias desde a concepcao ate a execucao.

## Visao Geral

O IdeaHub e uma aplicacao full-stack para gerenciamento de ideias com:
- Captura rapida de ideias (Inbox)
- Quadro Kanban com drag-and-drop
- Catalogo com filtros avancados
- Sistema de documentos com versionamento
- Biblioteca de prompts para IA
- Dashboard com insights e metricas

## Estrutura do Projeto

```
ideahub-mvp/
├── frontend/              # Aplicacao React
│   ├── src/              # Codigo fonte
│   ├── public/           # Assets estaticos
│   └── package.json      # Dependencias frontend
├── backend/              # API NestJS
│   ├── src/              # Codigo fonte
│   └── package.json      # Dependencias backend
└── README.md             # Este arquivo
```

## Stack Tecnologica

### Frontend (`/frontend`)
- **React 19** - Biblioteca para construcao de interfaces
- **Vite** - Build tool com Rolldown
- **TypeScript** - Tipagem estatica
- **Shadcn UI** - Componentes acessiveis baseados em Radix UI
- **Tailwind CSS** - Framework CSS utility-first
- **React Router 6** - Roteamento SPA
- **React Hook Form + Zod** - Formularios com validacao
- **Recharts** - Graficos e visualizacoes

### Backend (`/backend`)
- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **JWT** - Autenticacao
- **Swagger** - Documentacao da API

## Pre-requisitos

- Node.js 18+
- npm
- Docker & Docker Compose (para o backend)

## Instalacao Rapida

### Frontend (modo localStorage)

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:8080

### Backend + PostgreSQL

```bash
cd backend
npm install
docker-compose up -d
npm run start:dev
```

- API: http://localhost:3000/api
- Swagger: http://localhost:3000/api/docs
- pgAdmin: http://localhost:5050

### Conectar Frontend ao Backend

Edite o arquivo `frontend/.env`:

```env
VITE_USE_BACKEND=true
VITE_API_URL=http://localhost:3000/api
```

## Scripts Disponiveis

### Frontend (`cd frontend`)

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build para producao |
| `npm run preview` | Visualizar build local |
| `npm run lint` | Verificar codigo |
| `npm run format` | Formatar codigo |

### Backend (`cd backend`)

| Comando | Descricao |
|---------|-----------|
| `npm run start:dev` | Desenvolvimento com hot reload |
| `npm run build` | Build para producao |
| `npm run start:prod` | Iniciar em producao |
| `npm run lint` | Verificar codigo |
| `npm run test` | Executar testes |

## Funcionalidades

### Gestao de Ideias
- Captura rapida no Inbox
- Classificacao por status (Inbox, Avaliando, Aprovada, Em Progresso, Concluida, Arquivada)
- Categorizacao (Produto, Marketing, Tecnologia, Business, Design)
- Sistema de tags
- Calculo automatico de prioridade (Impacto/Esforco)

### Continuidade de Trabalho
- Registro de "Onde parei"
- Checklist de tarefas
- Snapshots de progresso
- Timeline de alteracoes
- Links de referencia
- Anexos de arquivos

### Documentos
- Editor Markdown com preview
- Sistema de pastas
- Historico de versoes
- Restauracao de versoes
- Vinculacao com ideias

### Prompts
- Biblioteca de templates
- Favoritos
- Contador de uso
- Categorias e tags

### Dashboard
- Ideias recentes
- Em progresso
- Ideias paradas (30+ dias)
- Graficos e metricas

## API Endpoints

### Autenticacao
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Autenticar

### Usuarios
- `GET /api/users/me` - Perfil atual
- `PATCH /api/users/me` - Atualizar perfil

### Ideias
- `GET /api/ideas` - Listar
- `POST /api/ideas` - Criar
- `GET /api/ideas/:id` - Obter
- `PATCH /api/ideas/:id` - Atualizar
- `DELETE /api/ideas/:id` - Remover

### Documentos
- `GET /api/documents` - Listar
- `POST /api/documents` - Criar
- `PATCH /api/documents/:id` - Atualizar
- `DELETE /api/documents/:id` - Remover
- `POST /api/documents/:id/restore/:versionId` - Restaurar versao

### Prompts
- `GET /api/prompts` - Listar
- `POST /api/prompts` - Criar
- `PATCH /api/prompts/:id` - Atualizar
- `DELETE /api/prompts/:id` - Remover
- `POST /api/prompts/:id/favorite` - Toggle favorito

## Variaveis de Ambiente

### Frontend (`frontend/.env`)
```env
VITE_USE_BACKEND=false
VITE_API_URL=http://localhost:3000/api
```

### Backend (`backend/.env`)
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ideahub
DATABASE_PASSWORD=ideahub_secret
DATABASE_NAME=ideahub
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
PORT=3000
```

## Licenca

Projeto privado - Todos os direitos reservados.
