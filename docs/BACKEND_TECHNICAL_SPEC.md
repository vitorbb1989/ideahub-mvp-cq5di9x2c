# IdeaHub Backend - Especificacao Tecnica

**Documento:** Especificacao Tecnica do Backend
**Versao:** 2.0.0
**Data:** 10 de Dezembro de 2025
**Status:** MVP - Fase 1 Concluida

---

## 1. VISAO GERAL

### 1.1 Proposito

O backend do IdeaHub e uma API REST desenvolvida para gerenciar o ciclo de vida completo de ideias, desde a captura inicial ate a conclusao. Oferece autenticacao segura com refresh tokens, persistencia de dados com migrations, e integracao com o frontend React.

### 1.2 Escopo

- Autenticacao e autorizacao de usuarios via JWT com refresh tokens
- CRUD completo para ideias com paginacao
- Gestao de documentos com versionamento
- Biblioteca de prompts para IA
- Isolamento de dados por usuario (multi-tenant)
- Rate limiting e protecao contra ataques
- Headers de seguranca com Helmet

### 1.3 Contexto do Sistema

```
┌─────────────────┐     HTTP/REST     ┌─────────────────┐
│    Frontend     │ ◄───────────────► │     Backend     │
│   React/Vite    │      JSON         │     NestJS      │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               │ TypeORM
                                               ▼
                                      ┌─────────────────┐
                                      │   PostgreSQL    │
                                      │    Database     │
                                      └─────────────────┘
```

---

## 2. STACK TECNOLOGICA

### 2.1 Framework e Runtime

| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| Node.js | 18+ | Runtime JavaScript |
| NestJS | 11.x | Framework backend |
| TypeScript | 5.7.x | Linguagem tipada |

### 2.2 Banco de Dados e ORM

| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| PostgreSQL | 16 | Banco de dados relacional |
| TypeORM | 0.3.x | ORM e migrations |

### 2.3 Autenticacao e Seguranca

| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| Passport.js | 0.7.x | Middleware de autenticacao |
| passport-jwt | 4.x | Estrategia JWT |
| bcryptjs | 3.x | Hash de senhas e refresh tokens |
| @nestjs/jwt | 11.x | Geracao de tokens |
| @nestjs/throttler | 6.x | Rate limiting |
| helmet | 8.x | Headers de seguranca |

### 2.4 Validacao e Documentacao

| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| class-validator | 0.14.x | Validacao de DTOs |
| class-transformer | 0.5.x | Transformacao de objetos |
| @nestjs/swagger | 11.x | Documentacao OpenAPI |

### 2.5 Infraestrutura

| Tecnologia | Versao | Proposito |
|------------|--------|-----------|
| Docker | - | Containerizacao |
| Docker Compose | 3.8 | Orquestracao local |
| pgAdmin | latest | Administracao do banco |

---

## 3. ARQUITETURA

### 3.1 Padrao Arquitetural

O projeto segue a arquitetura modular do NestJS, baseada em:

- **Modulos**: Encapsulamento de funcionalidades relacionadas
- **Controllers**: Endpoints HTTP e roteamento
- **Services**: Logica de negocios
- **Entities**: Modelos de dados (TypeORM)
- **DTOs**: Data Transfer Objects para validacao
- **Guards**: Protecao de rotas (JWT, Throttler)
- **Filters**: Tratamento de excecoes

### 3.2 Estrutura de Diretorios

```
backend/
├── src/
│   ├── config/                    # Configuracoes
│   │   ├── database.config.ts     # Config do PostgreSQL
│   │   ├── data-source.ts         # DataSource para CLI
│   │   ├── jwt.config.ts          # Config do JWT
│   │   └── index.ts               # Exportacoes
│   │
│   ├── common/                    # Recursos compartilhados
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── dto/
│   │   │   └── pagination.dto.ts
│   │   ├── filters/
│   │   │   ├── all-exceptions.filter.ts
│   │   │   ├── http-exception.filter.ts
│   │   │   ├── throttler-exception.filter.ts
│   │   │   └── index.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── interfaces/
│   │       └── paginated-response.interface.ts
│   │
│   ├── migrations/                # Migrations do TypeORM
│   │   ├── 1733840000000-InitialSchema.ts
│   │   └── 1733841000000-AddRefreshToken.ts
│   │
│   ├── modules/                   # Modulos de dominio
│   │   ├── auth/                  # Autenticacao
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   └── auth-response.dto.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   │
│   │   ├── users/                 # Usuarios
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   │
│   │   ├── ideas/                 # Ideias
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   │   └── idea.entity.ts
│   │   │   ├── ideas.controller.ts
│   │   │   ├── ideas.service.ts
│   │   │   └── ideas.module.ts
│   │   │
│   │   ├── documents/             # Documentos
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   │   └── document.entity.ts
│   │   │   ├── documents.controller.ts
│   │   │   ├── documents.service.ts
│   │   │   └── documents.module.ts
│   │   │
│   │   └── prompts/               # Prompts
│   │       ├── dto/
│   │       ├── entities/
│   │       │   └── prompt.entity.ts
│   │       ├── prompts.controller.ts
│   │       ├── prompts.service.ts
│   │       └── prompts.module.ts
│   │
│   ├── app.module.ts              # Modulo raiz
│   └── main.ts                    # Bootstrap
│
├── test/                          # Testes E2E
├── docker-compose.yml             # Infraestrutura
├── .env                           # Variaveis de ambiente
└── package.json                   # Dependencias
```

### 3.3 Fluxo de Requisicao

```
Request HTTP
     │
     ▼
┌─────────────┐
│   main.ts   │  Bootstrap, CORS, Helmet, Validation Pipe
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Throttler  │  Rate limiting por IP
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Guards     │  JwtAuthGuard (autenticacao)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │  Roteamento, validacao de DTOs
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │  Logica de negocios + ownership
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │  Acesso ao banco (TypeORM)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │  Persistencia
└─────────────┘
       │
       ▼
┌─────────────┐
│  Filters    │  Tratamento de excecoes
└─────────────┘
```

---

## 4. MODELO DE DADOS

### 4.1 Diagrama Entidade-Relacionamento

```
┌─────────────────────────────────────────────────────────────┐
│                          USERS                               │
├─────────────────────────────────────────────────────────────┤
│ id           UUID         PK                                 │
│ email        VARCHAR(255) UNIQUE NOT NULL                    │
│ name         VARCHAR(255) NOT NULL                           │
│ password     VARCHAR(255) NOT NULL (hashed)                  │
│ refreshToken VARCHAR(255) NULLABLE (hashed, select: false)   │
│ avatar       VARCHAR(255) NULLABLE                           │
│ isActive     BOOLEAN      DEFAULT true                       │
│ createdAt    TIMESTAMP    AUTO                               │
│ updatedAt    TIMESTAMP    AUTO                               │
└─────────────────────────────────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     IDEAS       │  │   DOCUMENTS     │  │    PROMPTS      │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id         UUID │  │ id         UUID │  │ id         UUID │
│ title      TEXT │  │ name       TEXT │  │ title      TEXT │
│ summary    TEXT │  │ type       ENUM │  │ content    TEXT │
│ description TEXT│  │ content    TEXT │  │ category   TEXT │
│ status     ENUM │  │ parentId   UUID │  │ tags      ARRAY │
│ category   ENUM │  │ versions  JSONB │  │ isFavorite BOOL │
│ tags      ARRAY │  │ userId     UUID │  │ usageCount INT  │
│ impact      INT │  │ createdAt  TIME │  │ userId     UUID │
│ effort      INT │  │ updatedAt  TIME │  │ createdAt  TIME │
│ priorityScore FL│  └─────────────────┘  │ updatedAt  TIME │
│ checklist JSONB │                       └─────────────────┘
│ attachments JSONB
│ links     JSONB │
│ snapshots JSONB │
│ lastSavedState JSONB
│ timeline  JSONB │
│ linkedDocIds ARRAY
│ userId     UUID │
│ createdAt  TIME │
│ updatedAt  TIME │
└─────────────────┘
```

### 4.2 Detalhamento das Entidades

#### 4.2.1 User (Usuario)

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  @Exclude()  // Nunca exposto nas respostas
  password: string;

  // Hashed refresh token for secure token rotation
  @Column({ nullable: true, select: false })
  @Exclude()
  refreshToken: string | null;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos 1:N
  @OneToMany(() => Idea, (idea) => idea.user)
  ideas: Idea[];

  @OneToMany(() => Document, (document) => document.user)
  documents: Document[];

  @OneToMany(() => Prompt, (prompt) => prompt.user)
  prompts: Prompt[];
}
```

#### 4.2.2 Idea (Ideia)

**Enums de Status:**
```typescript
export enum IdeaStatus {
  INBOX = 'inbox',           // Captura inicial
  EVALUATING = 'evaluating', // Em avaliacao
  APPROVED = 'approved',     // Aprovada
  IN_PROGRESS = 'in_progress', // Em desenvolvimento
  COMPLETED = 'completed',   // Concluida
  ARCHIVED = 'archived',     // Arquivada
}
```

**Enums de Categoria:**
```typescript
export enum IdeaCategory {
  PRODUCT = 'product',
  MARKETING = 'marketing',
  TECHNOLOGY = 'technology',
  BUSINESS = 'business',
  DESIGN = 'design',
  OTHER = 'other',
}
```

**Campos JSONB (PostgreSQL):**

| Campo | Estrutura | Proposito |
|-------|-----------|-----------|
| checklist | `{id, text, completed}[]` | Lista de tarefas |
| attachments | `{id, name, url, type}[]` | Arquivos anexados |
| links | `{id, title, url}[]` | Links de referencia |
| snapshots | `{id, title, content, createdAt}[]` | Capturas de progresso |
| lastSavedState | `{whereIStopped, whatIWasDoing, nextSteps, savedAt}` | Estado de continuidade |
| timeline | `{id, action, description, timestamp}[]` | Historico de alteracoes |

**Calculo de Prioridade:**
```typescript
priorityScore = (impact / effort) * 10
```
- Impact: 1-10 (quanto maior, mais impacto)
- Effort: 1-10 (quanto maior, mais esforco)
- Resultado: Ideias com alto impacto e baixo esforco tem maior score

#### 4.2.3 Document (Documento)

```typescript
export enum DocumentType {
  FILE = 'file',     // Arquivo markdown
  FOLDER = 'folder', // Pasta/diretorio
}
```

**Sistema de Versionamento:**
```typescript
versions: {
  id: string;
  content: string;
  createdAt: string;
  description: string;
}[]
```
- Cada edicao cria uma nova versao
- Possibilidade de restaurar versoes anteriores

#### 4.2.4 Prompt

- Templates reutilizaveis para IA
- Sistema de favoritos
- Contador de uso para analytics

---

## 5. API ENDPOINTS

### 5.1 Autenticacao (`/api/auth`)

| Metodo | Endpoint | Descricao | Auth | Rate Limit |
|--------|----------|-----------|------|------------|
| POST | `/register` | Criar nova conta | Nao | 3/hora |
| POST | `/login` | Autenticar usuario | Nao | 5/15min |
| POST | `/refresh` | Renovar tokens | Nao | 20/15min |
| POST | `/logout` | Invalidar refresh token | Sim | Global |

**Request - Register:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

**Response - Login/Register:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null
  }
}
```

**Request - Refresh:**
```json
{
  "userId": "uuid",
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response - Refresh:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "x1y2z3...",
  "expiresIn": 900
}
```

### 5.2 Usuarios (`/api/users`)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | `/me` | Perfil do usuario atual | Sim |
| PATCH | `/me` | Atualizar perfil | Sim |

### 5.3 Ideias (`/api/ideas`)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | `/?page=1&limit=20` | Listar ideias (paginado) | Sim |
| POST | `/` | Criar nova ideia | Sim |
| GET | `/:id` | Obter ideia especifica | Sim |
| PATCH | `/:id` | Atualizar ideia | Sim |
| DELETE | `/:id` | Remover ideia | Sim |

**Request - Create Idea:**
```json
{
  "title": "Nova funcionalidade",
  "summary": "Resumo da ideia",
  "description": "Descricao detalhada",
  "status": "inbox",
  "category": "product",
  "tags": ["innovation", "tech"],
  "impact": 8,
  "effort": 3,
  "checklist": [
    { "id": "1", "text": "Tarefa 1", "completed": false }
  ]
}
```

**Response - List (paginado):**
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

### 5.4 Documentos (`/api/documents`)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | `/?page=1&limit=20` | Listar documentos (paginado) | Sim |
| POST | `/` | Criar documento | Sim |
| GET | `/:id` | Obter documento | Sim |
| PATCH | `/:id` | Atualizar documento | Sim |
| DELETE | `/:id` | Remover documento | Sim |
| POST | `/:id/restore/:versionId` | Restaurar versao | Sim |

### 5.5 Prompts (`/api/prompts`)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | `/?page=1&limit=20` | Listar prompts (paginado) | Sim |
| POST | `/` | Criar prompt | Sim |
| GET | `/:id` | Obter prompt | Sim |
| PATCH | `/:id` | Atualizar prompt | Sim |
| DELETE | `/:id` | Remover prompt | Sim |
| POST | `/:id/use` | Incrementar contador de uso | Sim |
| POST | `/:id/favorite` | Toggle favorito | Sim |

---

## 6. SEGURANCA

### 6.1 Autenticacao JWT com Refresh Tokens

**Fluxo Completo:**
```
1. Usuario envia credenciais (login)
2. Backend valida e gera access token (15min) + refresh token (random 256-bit)
3. Refresh token e armazenado hasheado no banco
4. Frontend armazena ambos os tokens
5. Requisicoes incluem: Authorization: Bearer <access_token>
6. Quando access token expira, frontend usa /refresh com refresh token
7. Backend valida refresh token, gera novos tokens (rotacao)
8. Logout invalida o refresh token no banco
```

**Configuracao do Access Token:**
```typescript
{
  secret: process.env.JWT_SECRET,
  expiresIn: '15m'  // 15 minutos
}
```

**Payload do Access Token:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1733860800,
  "exp": 1733861700
}
```

**Refresh Token:**
- 256 bits de aleatoriedade criptografica
- Armazenado como hash bcrypt no banco
- Rotacionado a cada uso (impede reuso)
- Deteccao de ataque: reuso invalida todos os tokens

### 6.2 Hash de Senhas e Tokens

- Algoritmo: bcrypt
- Salt rounds: 10
- Senha e refresh token nunca armazenados em texto plano

```typescript
// Hash ao criar usuario
const hashedPassword = await bcrypt.hash(password, 10);

// Hash do refresh token
const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

// Validacao
const isValid = await bcrypt.compare(input, storedHash);
```

### 6.3 Rate Limiting

**Configuracao Multi-tier:**
```typescript
ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 3 },    // 3 req/segundo
  { name: 'medium', ttl: 10000, limit: 20 }, // 20 req/10 segundos
  { name: 'long', ttl: 60000, limit: 100 },  // 100 req/minuto
])
```

**Limites Especificos:**

| Endpoint | Limite | Motivo |
|----------|--------|--------|
| `/auth/register` | 3/hora | Previne criacao em massa de contas |
| `/auth/login` | 5/15min | Previne brute force |
| `/auth/refresh` | 20/15min | Previne token enumeration |

**Resposta 429:**
```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again later.",
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

### 6.4 Headers de Seguranca (Helmet)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
```

Headers adicionados:
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security

### 6.5 Isolamento de Dados (Ownership)

Todas as queries filtram por `userId` na clausula WHERE:

```typescript
async findOne(userId: string, id: string): Promise<Idea> {
  const idea = await this.ideasRepository.findOne({
    where: { id, userId },  // Filtra por usuario E id
  });
  if (!idea) {
    throw new NotFoundException('Idea not found');
  }
  return idea;
}
```

### 6.6 Validacao de Entrada

DTOs com class-validator:

```typescript
export class CreateIdeaDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(IdeaStatus)
  status?: IdeaStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  impact?: number;
}
```

Global Validation Pipe:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // Remove campos nao declarados
    transform: true,        // Transforma tipos automaticamente
    forbidNonWhitelisted: true,  // Erro se campo extra
  }),
);
```

### 6.7 Exception Filters

**Filtro HTTP (HttpExceptionFilter):**
- Trata todas as HttpException do NestJS
- Formato padronizado de resposta
- Inclui requestId para rastreamento
- Oculta stack traces em producao

**Filtro Geral (AllExceptionsFilter):**
- Catch-all para erros nao tratados
- Trata erros do TypeORM (QueryFailedError, EntityNotFoundError)
- Retorna 500 para erros desconhecidos

**Resposta de Erro Padrao:**
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

### 6.8 CORS

```typescript
app.enableCors({
  origin: ['http://localhost:8080', 'http://localhost:5173'],
  credentials: true,
});
```

---

## 7. CONFIGURACAO E AMBIENTE

### 7.1 Variaveis de Ambiente

```env
# Banco de Dados
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=ideahub
DATABASE_PASSWORD=ideahub_secret
DATABASE_NAME=ideahub

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Aplicacao
PORT=3000
NODE_ENV=development
```

### 7.2 Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ideahub-postgres
    environment:
      POSTGRES_USER: ideahub
      POSTGRES_PASSWORD: ideahub_secret
      POSTGRES_DB: ideahub
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ideahub']
      interval: 5s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: ideahub-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@ideahub.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - '5050:80'
    depends_on:
      - postgres

volumes:
  postgres_data:
  pgadmin_data:
```

---

## 8. MIGRATIONS

### 8.1 Configuracao

O sistema usa TypeORM migrations para gerenciamento do schema:

```typescript
// src/config/data-source.ts
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'ideahub',
  password: process.env.DATABASE_PASSWORD || 'ideahub_secret',
  database: process.env.DATABASE_NAME || 'ideahub',
  entities: [__dirname + '/../modules/**/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,  // SEMPRE false em producao
};
```

### 8.2 Comandos

```bash
# Gerar nova migration
npm run migration:generate -- src/migrations/NomeDaMigration

# Executar migrations pendentes
npm run migration:run

# Reverter ultima migration
npm run migration:revert

# Mostrar status
npm run migration:show
```

### 8.3 Migrations Existentes

| Migration | Descricao |
|-----------|-----------|
| 1733840000000-InitialSchema | Schema inicial (users, ideas, documents, prompts) |
| 1733841000000-AddRefreshToken | Adiciona coluna refreshToken em users |

---

## 9. PAGINACAO

### 9.1 Implementacao

Todos os endpoints de listagem suportam paginacao:

```typescript
// Query params
@Query() paginationQuery: PaginationQueryDto

// DTO
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### 9.2 Resposta Padrao

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

---

## 10. COMANDOS E OPERACOES

### 10.1 Desenvolvimento

```bash
# Instalar dependencias
npm install

# Iniciar banco de dados
docker-compose up -d

# Executar migrations
npm run migration:run

# Iniciar em desenvolvimento (hot reload)
npm run start:dev

# Build para producao
npm run build

# Iniciar em producao
npm run start:prod
```

### 10.2 Qualidade de Codigo

```bash
# Lint
npm run lint

# Formatar codigo
npm run format

# Testes
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

### 10.3 URLs de Acesso

| Servico | URL |
|---------|-----|
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| pgAdmin | http://localhost:5050 |
| PostgreSQL | localhost:5432 |

---

## 11. STATUS DE IMPLEMENTACAO

### 11.1 Seguranca

| Item | Status | Observacao |
|------|--------|------------|
| Migrations | Implementado | synchronize: false em producao |
| Rate Limiting | Implementado | @nestjs/throttler multi-tier |
| Refresh Tokens | Implementado | Rotacao, hash bcrypt |
| Helmet | Implementado | CSP configurado para Swagger |
| Input Validation | Implementado | class-validator com whitelist |
| Exception Handling | Implementado | Filtros globais |
| Ownership Validation | Implementado | userId em todas as queries |

### 11.2 Performance

| Item | Status | Recomendacao |
|------|--------|--------------|
| Paginacao | Implementado | Limite maximo 100 |
| Cache | Nao implementado | Adicionar Redis para cache |
| Indices | Automaticos | Criar indices customizados |
| Compressao | Nao implementado | Adicionar compression middleware |

### 11.3 Observabilidade

| Item | Status | Recomendacao |
|------|--------|--------------|
| Logging | Basico | Implementar Winston/Pino |
| Health Check | Nao implementado | Adicionar @nestjs/terminus |
| Metricas | Nao implementado | Adicionar Prometheus |
| Tracing | Nao implementado | Request IDs implementados |

### 11.4 Testes

| Item | Status | Meta |
|------|--------|------|
| Testes unitarios | Nao implementados | 80% coverage |
| Testes E2E | Estrutura criada | Implementar |
| Coverage | 0% | Meta: 80% |

---

## 12. HISTORICO DE VERSOES DO DOCUMENTO

| Versao | Data | Autor | Descricao |
|--------|------|-------|-----------|
| 1.0.0 | 10/12/2025 | Claude Code | Versao inicial |
| 2.0.0 | 10/12/2025 | Claude Code | Fase 1 - Seguranca e producao |

---

## 13. GLOSSARIO

| Termo | Definicao |
|-------|-----------|
| DTO | Data Transfer Object - objeto para transferencia de dados |
| JWT | JSON Web Token - padrao de token para autenticacao |
| ORM | Object-Relational Mapping - mapeamento objeto-relacional |
| CRUD | Create, Read, Update, Delete - operacoes basicas |
| Guard | Middleware de protecao de rotas no NestJS |
| Decorator | Anotacao que adiciona metadados a classes/metodos |
| Module | Unidade de organizacao no NestJS |
| Entity | Classe que representa uma tabela no banco |
| Repository | Padrao de acesso a dados |
| Migration | Script de alteracao do schema do banco |
| Throttler | Sistema de rate limiting |
| Refresh Token | Token de longa duracao para renovar access token |

---

*Documento atualizado apos conclusao da Fase 1 de producao.*
