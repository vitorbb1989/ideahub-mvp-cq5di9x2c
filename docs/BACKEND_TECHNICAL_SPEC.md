# IdeaHub Backend - Especificacao Tecnica

**Documento:** Especificacao Tecnica do Backend
**Versao:** 1.0.0
**Data:** 10 de Dezembro de 2025
**Status:** MVP - Desenvolvimento

---

## 1. VISAO GERAL

### 1.1 Proposito

O backend do IdeaHub e uma API REST desenvolvida para gerenciar o ciclo de vida completo de ideias, desde a captura inicial ate a conclusao. Oferece autenticacao segura, persistencia de dados e integracao com o frontend React.

### 1.2 Escopo

- Autenticacao e autorizacao de usuarios via JWT
- CRUD completo para ideias com features avancadas
- Gestao de documentos com versionamento
- Biblioteca de prompts para IA
- Isolamento de dados por usuario (multi-tenant)

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
| bcryptjs | 3.x | Hash de senhas |
| @nestjs/jwt | 11.x | Geracao de tokens |

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

### 3.2 Estrutura de Diretorios

```
backend/
├── src/
│   ├── config/                    # Configuracoes
│   │   ├── database.config.ts     # Config do PostgreSQL
│   │   ├── jwt.config.ts          # Config do JWT
│   │   └── index.ts               # Exportacoes
│   │
│   ├── common/                    # Recursos compartilhados
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   └── guards/
│   │       └── jwt-auth.guard.ts
│   │
│   ├── modules/                   # Modulos de dominio
│   │   ├── auth/                  # Autenticacao
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
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
│   main.ts   │  Bootstrap, CORS, Validation Pipe
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
│  Service    │  Logica de negocios
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
```

---

## 4. MODELO DE DADOS

### 4.1 Diagrama Entidade-Relacionamento

```
┌─────────────────────────────────────────────────────────────┐
│                          USERS                               │
├─────────────────────────────────────────────────────────────┤
│ id          UUID         PK                                  │
│ email       VARCHAR(255) UNIQUE NOT NULL                     │
│ name        VARCHAR(255) NOT NULL                            │
│ password    VARCHAR(255) NOT NULL (hashed)                   │
│ avatar      VARCHAR(255) NULLABLE                            │
│ isActive    BOOLEAN      DEFAULT true                        │
│ createdAt   TIMESTAMP    AUTO                                │
│ updatedAt   TIMESTAMP    AUTO                                │
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

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| POST | `/register` | Criar nova conta | Nao |
| POST | `/login` | Autenticar usuario | Nao |

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
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar": null,
    "isActive": true,
    "createdAt": "2025-12-10T00:00:00.000Z",
    "updatedAt": "2025-12-10T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
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
| GET | `/` | Listar todas as ideias do usuario | Sim |
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

### 5.4 Documentos (`/api/documents`)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | `/` | Listar documentos | Sim |
| POST | `/` | Criar documento | Sim |
| GET | `/:id` | Obter documento | Sim |
| PATCH | `/:id` | Atualizar documento | Sim |
| DELETE | `/:id` | Remover documento | Sim |
| POST | `/:id/restore/:versionId` | Restaurar versao | Sim |

### 5.5 Prompts (`/api/prompts`)

| Metodo | Endpoint | Descricao | Auth |
|--------|----------|-----------|------|
| GET | `/` | Listar prompts | Sim |
| POST | `/` | Criar prompt | Sim |
| GET | `/:id` | Obter prompt | Sim |
| PATCH | `/:id` | Atualizar prompt | Sim |
| DELETE | `/:id` | Remover prompt | Sim |
| POST | `/:id/use` | Incrementar contador de uso | Sim |
| POST | `/:id/favorite` | Toggle favorito | Sim |

---

## 6. SEGURANCA

### 6.1 Autenticacao JWT

**Fluxo:**
```
1. Usuario envia credenciais (login)
2. Backend valida e gera JWT
3. Frontend armazena token
4. Requisicoes subsequentes incluem: Authorization: Bearer <token>
5. Guard valida token em cada requisicao protegida
```

**Configuracao do Token:**
```typescript
{
  secret: process.env.JWT_SECRET,
  expiresIn: '7d'
}
```

**Payload do Token:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "iat": 1733860800,
  "exp": 1734465600
}
```

### 6.2 Hash de Senhas

- Algoritmo: bcrypt
- Salt rounds: 10
- Senha nunca armazenada em texto plano

```typescript
// Hash ao criar usuario
const hashedPassword = await bcrypt.hash(password, 10);

// Validacao no login
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### 6.3 Isolamento de Dados

Todas as queries filtram por `userId`:

```typescript
async findAll(userId: string): Promise<Idea[]> {
  return this.ideasRepository.find({
    where: { userId },  // Filtra por usuario
    order: { updatedAt: 'DESC' },
  });
}
```

### 6.4 Validacao de Entrada

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

### 6.5 CORS

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
JWT_EXPIRES_IN=7d

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

## 8. PONTOS DE ATENCAO E MELHORIAS SUGERIDAS

### 8.1 Seguranca

| Item | Status Atual | Recomendacao |
|------|--------------|--------------|
| `synchronize: true` | Ativo | Desativar em producao, usar migrations |
| Rate Limiting | Nao implementado | Adicionar @nestjs/throttler |
| Refresh Token | Nao implementado | Implementar rotacao de tokens |
| Helmet | Nao implementado | Adicionar headers de seguranca |
| Input Sanitization | Basica | Adicionar sanitizacao contra XSS |

### 8.2 Performance

| Item | Status Atual | Recomendacao |
|------|--------------|--------------|
| Paginacao | Nao implementado | Adicionar limit/offset nos endpoints de listagem |
| Cache | Nao implementado | Adicionar Redis para cache de queries |
| Indices | Automaticos | Criar indices customizados para campos filtrados |
| Compressao | Nao implementado | Adicionar compression middleware |

### 8.3 Observabilidade

| Item | Status Atual | Recomendacao |
|------|--------------|--------------|
| Logging | console.log basico | Implementar logger estruturado (Winston/Pino) |
| Health Check | Nao implementado | Adicionar @nestjs/terminus |
| Metricas | Nao implementado | Adicionar Prometheus/OpenTelemetry |
| Tracing | Nao implementado | Implementar request tracing |

### 8.4 Testes

| Item | Status Atual | Recomendacao |
|------|--------------|--------------|
| Testes unitarios | Nao implementados | Adicionar testes para services |
| Testes E2E | Estrutura criada | Implementar testes de integracao |
| Coverage | 0% | Meta minima: 80% |

### 8.5 Arquitetura

| Item | Status Atual | Recomendacao |
|------|--------------|--------------|
| Soft Delete | Nao implementado | Adicionar para ideias arquivadas |
| Auditoria | Parcial (timeline) | Expandir para todas as entidades |
| File Upload | URL externa | Implementar storage (S3/local) |
| Busca | Filtro simples | Adicionar full-text search |

---

## 9. COMANDOS E OPERACOES

### 9.1 Desenvolvimento

```bash
# Instalar dependencias
npm install

# Iniciar banco de dados
docker-compose up -d

# Iniciar em desenvolvimento (hot reload)
npm run start:dev

# Build para producao
npm run build

# Iniciar em producao
npm run start:prod
```

### 9.2 Qualidade de Codigo

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

### 9.3 URLs de Acesso

| Servico | URL |
|---------|-----|
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| pgAdmin | http://localhost:5050 |
| PostgreSQL | localhost:5432 |

---

## 10. HISTORICO DE VERSOES DO DOCUMENTO

| Versao | Data | Autor | Descricao |
|--------|------|-------|-----------|
| 1.0.0 | 10/12/2025 | Claude Code | Versao inicial |

---

## 11. GLOSSARIO

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

---

*Documento gerado automaticamente. Para atualizacoes, consulte o repositorio do projeto.*
