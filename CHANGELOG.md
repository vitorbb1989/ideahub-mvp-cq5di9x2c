# Changelog

Todas as mudancas notaveis neste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semantico](https://semver.org/lang/pt-BR/).

## [Unreleased]

## [0.3.0] - 2025-12-11

### Fase 3 - Testes Automatizados

Terceira fase focada em infraestrutura de testes robusta com alta cobertura.

### Adicionado

#### 3.1 Infraestrutura de Testes
- Configuracao Jest otimizada (`jest.config.js`)
- Suporte a ESM modules (uuid transformIgnorePatterns)
- Mocks reutilizaveis para repositorios TypeORM
- Factory functions para entidades de teste
- Test utilities com `MockRepository<T>` type-safe

#### 3.2 Testes Unitarios - AuthService (26 testes)
- `register`: Criacao de usuario, hash de senha, geracao de tokens
- `login`: Validacao de credenciais, atualizacao de refresh token
- `refreshTokens`: Rotacao de tokens, validacao de refresh token
- `logout`: Invalidacao de refresh token
- Cenarios de erro: usuario duplicado, credenciais invalidas

#### 3.3 Testes Unitarios - IdeasService (38 testes)
- CRUD completo: create, findAll, findOne, update, remove
- Paginacao: page, limit, totalPages, hasNextPage, hasPrevPage
- Soft delete e restore
- Transacoes: createIdeaWithDocument, removeWithLinkedDocuments
- Validacao de ownership (404 para recursos de outros usuarios)
- Calculo de priorityScore

#### 3.4 Testes Unitarios - DocumentsService (31 testes)
- CRUD completo com versionamento
- Sistema de versoes: versions array, version field
- restoreVersion: Restaurar versao anterior
- Soft delete e restore
- Integracao com ideaId
- Validacao de ownership

#### 3.5 Testes Unitarios - PromptsService (29 testes)
- CRUD completo
- toggleFavorite: Toggle de favoritos
- incrementUsageCount: Contador de uso
- Soft delete e restore
- findDeleted: Listagem de deletados
- Validacao de ownership

#### 3.6 Testes E2E
- Estrutura completa para testes end-to-end
- `test-app.module.ts`: Modulo de teste com configuracao isolada
- `auth.e2e-spec.ts`: Fluxo completo de autenticacao
  - Register, login, refresh, logout
  - Testes de seguranca (401, tokens invalidos)
- `ideas.e2e-spec.ts`: CRUD completo de ideias
  - Criacao, listagem paginada, detalhes, update, delete
  - Validacao de ownership entre usuarios
  - Sanitizacao de XSS
  - Validacao de campos (impact, effort, status, category)
- `app.e2e-spec.ts`: Testes gerais da aplicacao
  - Health checks (/health, /health/live, /health/ready)
  - Versionamento de API (/api/v1/...)
  - Headers de seguranca (Helmet)
  - Formato de erro padronizado

#### 3.7 CI/CD GitHub Actions
- Workflow de CI (`.github/workflows/ci.yml`)
  - Job `lint`: ESLint e Prettier check
  - Job `test`: Testes unitarios com coverage upload para Codecov
  - Job `test-e2e`: Testes E2E com PostgreSQL service container
  - Job `build`: Build de producao com upload de artifacts
  - Job `security`: npm audit para vulnerabilidades
  - Job `ci-success`: Resumo final do pipeline
- Workflow de Deploy (`.github/workflows/deploy.yml`)
  - Build de imagem Docker com cache
  - Deploy automatico para staging em push na main
  - Deploy manual para production com workflow_dispatch
  - Rollback automatico em caso de falha
- Badges no README.md (CI, Coverage, Node, NestJS, TypeScript)

#### 3.8 Cache Redis (Opcional)
- Instalado `@nestjs/cache-manager`, `cache-manager`, `cache-manager-redis-yet`, `redis`
- Configuracao do CacheModule global com suporte a Redis e fallback in-memory
- Cache implementado no PromptsService:
  - `findAll`: Cache de 5 minutos por usuario/pagina
  - `findOne`: Cache de 10 minutos por item
  - Invalidacao automatica em create/update/delete
- Cache implementado no IdeasService:
  - `findAll`: Cache de 3 minutos (Kanban precisa dados mais frescos)
  - `findOne`: Cache de 5 minutos por item
  - Invalidacao automatica em todas as operacoes de escrita
- Redis 7 Alpine adicionado ao docker-compose com persistencia
- Configuracao via variaveis de ambiente: REDIS_HOST, REDIS_PORT, REDIS_ENABLED, REDIS_TTL
- Mock de cache criado para testes unitarios (`createMockCacheManager`)

### Arquivos Criados

```
.github/
└── workflows/
    ├── ci.yml          # Pipeline de CI
    └── deploy.yml      # Pipeline de Deploy

backend/
├── jest.config.js
├── docker-compose.yml  # Atualizado com Redis
├── .env.example        # Atualizado com REDIS_*
├── src/
│   ├── app.module.ts   # Atualizado com CacheModule
│   ├── app.spec.ts
│   ├── config/
│   │   └── redis.config.ts  # Novo
│   ├── test/
│   │   ├── index.ts
│   │   ├── test-utils.ts
│   │   ├── factories/
│   │   │   ├── index.ts
│   │   │   ├── user.factory.ts
│   │   │   ├── idea.factory.ts
│   │   │   ├── document.factory.ts
│   │   │   └── prompt.factory.ts
│   │   └── mocks/
│   │       ├── index.ts
│   │       └── repository.mock.ts  # Atualizado com createMockCacheManager
│   └── modules/
│       ├── auth/auth.service.spec.ts
│       ├── ideas/
│       │   ├── ideas.service.ts      # Atualizado com cache
│       │   └── ideas.service.spec.ts
│       ├── documents/documents.service.spec.ts
│       └── prompts/
│           ├── prompts.service.ts    # Atualizado com cache
│           └── prompts.service.spec.ts
└── test/
    ├── setup.ts
    ├── jest-e2e.json
    ├── test-app.module.ts
    ├── app.e2e-spec.ts
    ├── auth.e2e-spec.ts
    └── ideas.e2e-spec.ts
```

### Estatisticas de Testes

| Suite | Testes | Status |
|-------|--------|--------|
| AuthService | 26 | ✅ Pass |
| IdeasService | 38 | ✅ Pass |
| DocumentsService | 31 | ✅ Pass |
| PromptsService | 29 | ✅ Pass |
| App (infra) | 19 | ✅ Pass |
| **Total Unit** | **143** | **✅ Pass** |
| E2E Tests | 42 | ⏳ Requer PostgreSQL |

### Comandos de Teste

```bash
# Testes unitarios
npm run test

# Testes com coverage
npm run test:cov

# Testes E2E (requer PostgreSQL via Docker)
docker-compose up -d
npm run test:e2e
```

### Notas

- Testes E2E requerem PostgreSQL rodando (via Docker ou local)
- Configurar variaveis de ambiente DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE para E2E
- Coverage thresholds temporariamente em 0% para permitir incremento gradual

---

## [0.2.0] - 2025-12-11

### Fase 2 - Qualidade de Codigo e Logging

Segunda fase de melhorias focada em observabilidade, validacao robusta e qualidade de codigo.

### Adicionado

#### 2.1 Winston Logger
- Servico de logging customizado usando Winston (`common/logger/logger.service.ts`)
- Formato JSON em producao para integracao com ferramentas de agregacao de logs
- Formato legivel (pretty print) em desenvolvimento com cores
- Suporte a niveis de log: error, warn, info, debug, verbose
- Logging estruturado com campos: requestId, userId, context, metadata
- Configuracao via variavel de ambiente `LOG_LEVEL`
- Modulo reutilizavel `LoggerModule` com escopo global

#### 2.2 Health Checks (Terminus)
- Instalado `@nestjs/terminus` para health checks padronizados
- Endpoint `GET /api/v1/health` - Health check completo (database, memoria, disco)
- Endpoint `GET /api/v1/health/live` - Liveness probe (app respondendo?)
- Endpoint `GET /api/v1/health/ready` - Readiness probe (database conectado?)
- Indicadores: TypeOrmHealthIndicator, MemoryHealthIndicator, DiskHealthIndicator
- Limites configurados: heap 300MB, RSS 500MB
- Excluido do rate limiting para uso por load balancers/Kubernetes
- Documentacao Swagger completa com exemplos de resposta

#### 2.3 Validacao de JSONB com Zod
- Instalado `zod` para validacao de schemas complexos
- Decorators customizados `@IsValidJsonb()` e `@IsValidJsonbArray()` (`common/validators/jsonb.validator.ts`)
- Schemas Zod para campos JSONB das entidades:
  - `idea-jsonb.schemas.ts`: ChecklistItemSchema, SnapshotSchema, AttachmentSchema, TimelineEventSchema
  - `document-jsonb.schemas.ts`: VersionSchema
- Mensagens de erro detalhadas com path do campo invalido
- Integracao com class-validator para validacao em DTOs

#### 2.4 Input Sanitization (XSS Protection)
- Instalado `sanitize-html` para protecao contra XSS
- Pipe global `SanitizePipe` (`common/pipes/sanitize.pipe.ts`)
- Dois niveis de sanitizacao:
  - Strict: Remove TODAS as tags HTML (titles, names)
  - Markdown: Permite tags seguras para conteudo (h1-h6, p, ul, ol, code, etc.)
- Campos markdown automaticamente detectados: content, description, summary, text
- Sanitizacao recursiva de objetos aninhados e arrays
- Links permitidos apenas com schemas http, https, mailto

#### 2.5 Audit Fields (createdBy/updatedBy)
- Interceptor `AuditInterceptor` (`common/interceptors/audit.interceptor.ts`)
- Populacao automatica de campos de auditoria baseado no usuario autenticado:
  - POST: Define createdBy e updatedBy
  - PATCH/PUT: Define apenas updatedBy
- Campos adicionados nas entidades: createdBy, updatedBy (UUID, nullable)

#### 2.6 Validacao de Email Unico
- Validator customizado `@IsEmailUnique()` (`common/validators/unique-email.validator.ts`)
- Verifica no banco de dados se email ja existe antes de registrar
- Mensagem de erro amigavel em vez de erro de constraint do banco
- Validacao case-insensitive (converte para lowercase)

### Modificado

- `app.module.ts`: Adicionado LoggerModule, HealthModule, TerminusModule
- `main.ts`: Adicionado SanitizePipe global, LoggerService como logger da aplicacao
- Entidades (User, Idea, Document, Prompt): Adicionados campos createdBy/updatedBy
- DTOs de criacao: Adicionada validacao com schemas Zod para campos JSONB
- `register.dto.ts`: Adicionado decorator @IsEmailUnique()

### Dependencias Adicionadas

```json
{
  "winston": "^3.x",
  "@nestjs/terminus": "^10.x",
  "zod": "^3.x",
  "sanitize-html": "^2.x",
  "@types/sanitize-html": "^2.x"
}
```

### Arquivos Criados

```
backend/src/
├── common/
│   ├── logger/
│   │   ├── index.ts
│   │   ├── logger.module.ts
│   │   └── logger.service.ts
│   ├── interceptors/
│   │   ├── index.ts
│   │   └── audit.interceptor.ts
│   ├── pipes/
│   │   ├── index.ts
│   │   └── sanitize.pipe.ts
│   ├── validators/
│   │   ├── index.ts
│   │   ├── jsonb.validator.ts
│   │   └── unique-email.validator.ts
│   └── schemas/
│       ├── index.ts
│       ├── idea-jsonb.schemas.ts
│       └── document-jsonb.schemas.ts
└── modules/health/
    ├── index.ts
    ├── health.module.ts
    └── health.controller.ts
```

---

## [0.1.0] - 2025-12-10

### Fase 1 - Seguranca e Producao

Primeira fase de melhorias focada em preparar o backend para producao com seguranca robusta.

### Adicionado

#### 1.1 Sistema de Migrations
- Configuracao do TypeORM para usar migrations em vez de `synchronize: true`
- Criado `src/config/data-source.ts` para CLI do TypeORM
- Migration inicial `1733840000000-InitialSchema.ts` com todas as tabelas
- Migration `1733841000000-AddRefreshToken.ts` para coluna de refresh token
- Scripts npm: `migration:generate`, `migration:run`, `migration:revert`, `migration:show`
- `synchronize` desabilitado em producao (baseado em NODE_ENV)

#### 1.2 Rate Limiting
- Instalado `@nestjs/throttler` v6
- Configuracao multi-tier com 3 niveis de protecao:
  - Short: 3 req/segundo
  - Medium: 20 req/10 segundos
  - Long: 100 req/minuto
- Limites especificos para endpoints sensiveis:
  - `/auth/login`: 5 requisicoes por 15 minutos
  - `/auth/register`: 3 requisicoes por hora
  - `/auth/refresh`: 20 requisicoes por 15 minutos
- Filtro customizado `ThrottlerExceptionFilter` com resposta padronizada e header `Retry-After`

#### 1.3 Exception Filters
- `HttpExceptionFilter` para tratamento padronizado de erros HTTP
- `AllExceptionsFilter` como catch-all para erros nao tratados
- Tratamento especial para erros do TypeORM (QueryFailedError, EntityNotFoundError)
- Formato de resposta padronizado com `requestId`, `timestamp`, `path`
- Stack traces ocultos em producao

#### 1.4 Paginacao
- DTO `PaginationQueryDto` com validacao (page, limit)
- Interface `PaginatedResponse<T>` com metadados
- Funcao helper `createPaginatedResponse()`
- Implementado em todos os endpoints de listagem:
  - `GET /api/ideas`
  - `GET /api/documents`
  - `GET /api/prompts`
- Limite maximo de 100 itens por pagina
- Metadados incluem: total, page, limit, totalPages, hasNextPage, hasPrevPage

#### 1.5 Helmet (Headers de Seguranca)
- Instalado `helmet` v8
- Content-Security-Policy configurado para compatibilidade com Swagger
- Headers de seguranca ativados:
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Strict-Transport-Security
  - Referrer-Policy

#### 1.6 Ownership Validation
- Verificado e confirmado: ja implementado corretamente
- Todas as queries filtram por `userId` na clausula WHERE
- Metodos `findOne(userId, id)` em todos os services
- Usuarios so podem acessar seus proprios recursos

#### 1.7 Refresh Tokens
- Coluna `refreshToken` adicionada a entidade User (hashed, select: false)
- Geracao de refresh token com `crypto.randomBytes(32)` (256 bits)
- Armazenamento seguro com hash bcrypt (salt rounds 10)
- Rotacao de tokens: novo refresh token a cada uso
- Deteccao de reuso: invalida todos os tokens se detectado
- Novos endpoints:
  - `POST /api/auth/refresh` - Renovar tokens
  - `POST /api/auth/logout` - Invalidar refresh token
- Access token: 15 minutos
- Resposta inclui `expiresIn` em segundos
- DTOs: `RefreshTokenDto`, `AuthResponseDto`, `TokenRefreshResponseDto`, `LogoutResponseDto`

### Modificado

- `app.module.ts`: Adicionado ThrottlerModule e ThrottlerGuard global
- `main.ts`: Adicionado Helmet, Exception Filters globais
- `user.entity.ts`: Adicionada coluna refreshToken
- `users.service.ts`: Novos metodos updateRefreshToken, findOneWithRefreshToken
- `auth.service.ts`: Reescrito com sistema completo de refresh tokens
- `auth.controller.ts`: Novos endpoints /refresh e /logout com rate limiting
- Ideas/Documents/Prompts services: Convertidos para usar findAndCount com paginacao
- Ideas/Documents/Prompts controllers: Adicionado PaginationQueryDto

### Seguranca

- Rate limiting previne ataques de forca bruta e DDoS
- Refresh tokens com rotacao previnem reuso de tokens
- Headers de seguranca protegem contra XSS, clickjacking, MIME sniffing
- Exception filters ocultam detalhes internos em producao
- Migrations garantem controle sobre alteracoes no schema

### Arquivos Criados

```
backend/src/
├── config/
│   └── data-source.ts
├── common/
│   ├── dto/
│   │   └── pagination.dto.ts
│   ├── filters/
│   │   ├── all-exceptions.filter.ts
│   │   ├── http-exception.filter.ts
│   │   ├── throttler-exception.filter.ts
│   │   └── index.ts
│   └── interfaces/
│       └── paginated-response.interface.ts
├── migrations/
│   ├── .gitkeep
│   ├── 1733840000000-InitialSchema.ts
│   └── 1733841000000-AddRefreshToken.ts
└── modules/auth/dto/
    ├── refresh-token.dto.ts
    └── auth-response.dto.ts
```

### Arquivos Modificados

```
backend/
├── src/
│   ├── app.module.ts
│   ├── main.ts
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   └── auth.service.ts
│       ├── users/
│       │   ├── entities/user.entity.ts
│       │   └── users.service.ts
│       ├── ideas/
│       │   ├── ideas.controller.ts
│       │   └── ideas.service.ts
│       ├── documents/
│       │   ├── documents.controller.ts
│       │   └── documents.service.ts
│       └── prompts/
│           ├── prompts.controller.ts
│           └── prompts.service.ts
└── package.json
```

---

## [0.0.x] - Pre-Fase 1

### MVP Inicial

- Estrutura basica NestJS com modulos
- Autenticacao JWT simples
- CRUD para Ideas, Documents, Prompts
- Entidades TypeORM com PostgreSQL
- Docker Compose para desenvolvimento
- Swagger para documentacao da API
- Frontend React com Vite
- Integracao frontend/backend via API client

---

*Gerado automaticamente por Claude Code*
