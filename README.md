# IdeaHub MVP

![CI](https://github.com/USER/ideahub-mvp/workflows/CI/badge.svg)
![Coverage](https://codecov.io/gh/USER/ideahub-mvp/branch/main/graph/badge.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)
![Node](https://img.shields.io/badge/node-20.x-green.svg)
![NestJS](https://img.shields.io/badge/nestjs-11.x-red.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)

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
│   │   ├── common/       # Recursos compartilhados (guards, filters, DTOs)
│   │   ├── config/       # Configuracoes (database, JWT, data-source)
│   │   ├── migrations/   # Migrations do TypeORM
│   │   └── modules/      # Modulos (auth, users, ideas, documents, prompts)
│   └── package.json      # Dependencias backend
├── docs/                 # Documentacao tecnica
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
- **NestJS 11** - Framework Node.js
- **TypeORM 0.3** - ORM para PostgreSQL com migrations
- **PostgreSQL 16** - Banco de dados relacional
- **JWT** - Autenticacao com access + refresh tokens
- **Swagger** - Documentacao da API
- **Helmet** - Headers de seguranca
- **@nestjs/throttler** - Rate limiting

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
| `npm run migration:generate` | Gerar migration |
| `npm run migration:run` | Executar migrations |
| `npm run migration:revert` | Reverter migration |
| `npm run migration:show` | Mostrar status |
| `npm run test` | Testes unitarios |
| `npm run test:cov` | Testes com coverage |
| `npm run test:e2e` | Testes E2E (requer PostgreSQL) |

## CI/CD

O projeto usa GitHub Actions para automacao de CI/CD.

### Workflows

| Workflow | Trigger | Jobs |
|----------|---------|------|
| **CI** | Push/PR em main, develop | lint, test, test-e2e, build, security |
| **Deploy** | Push em main, manual | docker-build, deploy-staging, deploy-production |

### Pipeline de CI

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│  Lint   │───▶│Unit Tests│───▶│E2E Tests │───▶│  Build  │
└─────────┘    └──────────┘    └──────────┘    └─────────┘
                    │               │
                    ▼               ▼
              ┌──────────┐    ┌──────────┐
              │ Coverage │    │PostgreSQL│
              └──────────┘    └──────────┘
```

### Executar Testes Localmente

```bash
# Testes unitarios (143 testes)
cd backend
npm run test

# Testes com coverage
npm run test:cov

# Testes E2E (requer Docker)
docker-compose up -d
npm run test:e2e
```

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
- `POST /api/auth/login` - Autenticar (retorna access + refresh token)
- `POST /api/auth/refresh` - Renovar tokens
- `POST /api/auth/logout` - Invalidar refresh token

### Usuarios
- `GET /api/users/me` - Perfil atual
- `PATCH /api/users/me` - Atualizar perfil

### Ideias (paginado)
- `GET /api/ideas?page=1&limit=20` - Listar
- `POST /api/ideas` - Criar
- `GET /api/ideas/:id` - Obter
- `PATCH /api/ideas/:id` - Atualizar
- `DELETE /api/ideas/:id` - Remover

### Documentos (paginado)
- `GET /api/documents?page=1&limit=20` - Listar
- `POST /api/documents` - Criar
- `PATCH /api/documents/:id` - Atualizar
- `DELETE /api/documents/:id` - Remover
- `POST /api/documents/:id/restore/:versionId` - Restaurar versao

### Prompts (paginado)
- `GET /api/prompts?page=1&limit=20` - Listar
- `POST /api/prompts` - Criar
- `PATCH /api/prompts/:id` - Atualizar
- `DELETE /api/prompts/:id` - Remover
- `POST /api/prompts/:id/favorite` - Toggle favorito
- `POST /api/prompts/:id/use` - Incrementar uso

## Variaveis de Ambiente

### Frontend (`frontend/.env`)
```env
VITE_USE_BACKEND=false
VITE_API_URL=http://localhost:3000/api
```

### Backend (`backend/.env`)
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ideahub
DATABASE_PASSWORD=ideahub_secret
DATABASE_NAME=ideahub

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# App
PORT=3000
NODE_ENV=development
```

## Seguranca Implementada

| Recurso | Descricao |
|---------|-----------|
| Rate Limiting | 100 req/min global, 5/15min login, 3/hora registro |
| Helmet | Headers de seguranca (CSP, HSTS, X-Frame-Options) |
| JWT Refresh Tokens | Access token 15min, refresh token 7 dias com rotacao |
| Ownership Validation | Usuarios so acessam seus proprios recursos |
| Password Hashing | bcrypt com salt rounds 10 |
| Input Validation | class-validator com whitelist |
| Exception Handling | Filtros globais, stack traces ocultos em producao |

## Licenca

Projeto privado - Todos os direitos reservados.
