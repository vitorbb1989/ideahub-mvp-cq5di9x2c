# IdeaHub Backend

Backend API para o IdeaHub - Plataforma de Gestao de Ideias.

## Stack

- **NestJS 11** - Framework Node.js
- **TypeORM 0.3** - ORM para PostgreSQL com migrations
- **PostgreSQL 16** - Banco de dados relacional
- **JWT** - Autenticacao com access + refresh tokens
- **Swagger** - Documentacao da API
- **Helmet** - Headers de seguranca
- **@nestjs/throttler** - Rate limiting

## Requisitos

- Node.js 18+
- Docker & Docker Compose

## Instalacao

```bash
# Instalar dependencias
npm install

# Iniciar o banco de dados
docker-compose up -d

# Executar migrations
npm run migration:run

# Iniciar em modo desenvolvimento
npm run start:dev
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

## Endpoints

A documentacao completa da API esta disponivel em:
- **Swagger UI**: http://localhost:3000/api/docs

### Auth
- `POST /api/auth/register` - Registrar novo usuario
- `POST /api/auth/login` - Login (retorna access + refresh token)
- `POST /api/auth/refresh` - Renovar tokens
- `POST /api/auth/logout` - Invalidar refresh token

### Users
- `GET /api/users/me` - Perfil do usuario atual
- `PATCH /api/users/me` - Atualizar perfil

### Ideas (paginado)
- `GET /api/ideas?page=1&limit=20` - Listar ideias
- `POST /api/ideas` - Criar ideia
- `GET /api/ideas/:id` - Obter ideia
- `PATCH /api/ideas/:id` - Atualizar ideia
- `DELETE /api/ideas/:id` - Deletar ideia

### Documents (paginado)
- `GET /api/documents?page=1&limit=20` - Listar documentos
- `POST /api/documents` - Criar documento
- `GET /api/documents/:id` - Obter documento
- `PATCH /api/documents/:id` - Atualizar documento
- `DELETE /api/documents/:id` - Deletar documento
- `POST /api/documents/:id/restore/:versionId` - Restaurar versao

### Prompts (paginado)
- `GET /api/prompts?page=1&limit=20` - Listar prompts
- `POST /api/prompts` - Criar prompt
- `GET /api/prompts/:id` - Obter prompt
- `PATCH /api/prompts/:id` - Atualizar prompt
- `DELETE /api/prompts/:id` - Deletar prompt
- `POST /api/prompts/:id/use` - Incrementar uso
- `POST /api/prompts/:id/favorite` - Toggle favorito

## Variaveis de Ambiente

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

## Docker

```bash
# Iniciar PostgreSQL + pgAdmin
docker-compose up -d

# pgAdmin disponivel em: http://localhost:5050
# Email: admin@ideahub.local
# Senha: admin
```

## Scripts

### Desenvolvimento
```bash
npm run start:dev   # Desenvolvimento com hot reload
npm run build       # Build para producao
npm run start:prod  # Producao
npm run lint        # Verificar codigo
npm run test        # Testes
```

### Migrations
```bash
npm run migration:generate -- src/migrations/NomeDaMigration  # Gerar migration
npm run migration:run        # Executar migrations pendentes
npm run migration:revert     # Reverter ultima migration
npm run migration:show       # Mostrar status das migrations
```

## Arquitetura

```
backend/
├── src/
│   ├── common/              # Recursos compartilhados
│   │   ├── decorators/      # @CurrentUser
│   │   ├── dto/             # PaginationQueryDto
│   │   ├── filters/         # Exception filters
│   │   ├── guards/          # JwtAuthGuard
│   │   └── interfaces/      # PaginatedResponse
│   ├── config/              # Configuracoes
│   │   ├── database.config.ts
│   │   ├── data-source.ts   # TypeORM CLI
│   │   └── jwt.config.ts
│   ├── migrations/          # Migrations do TypeORM
│   └── modules/             # Modulos de dominio
│       ├── auth/            # Autenticacao JWT
│       ├── users/           # Usuarios
│       ├── ideas/           # Ideias
│       ├── documents/       # Documentos
│       └── prompts/         # Prompts
├── docker-compose.yml
└── package.json
```

## Rate Limiting

| Endpoint | Limite |
|----------|--------|
| Global | 100 req/min |
| `/auth/login` | 5 req/15min |
| `/auth/register` | 3 req/hora |
| `/auth/refresh` | 20 req/15min |

## Resposta de Erro Padrao

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2025-12-10T12:00:00.000Z",
  "path": "/api/ideas",
  "requestId": "abc123"
}
```

## Paginacao

Todos os endpoints de listagem suportam paginacao:

```
GET /api/ideas?page=1&limit=20
```

Resposta:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
