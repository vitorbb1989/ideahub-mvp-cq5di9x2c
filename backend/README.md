# IdeaHub Backend

Backend API para o IdeaHub - Plataforma de Gestão de Ideias.

## Stack

- **NestJS** - Framework Node.js
- **TypeORM** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **Swagger** - Documentação da API

## Requisitos

- Node.js 18+
- Docker & Docker Compose

## Instalação

```bash
# Instalar dependências
npm install

# Iniciar o banco de dados
docker-compose up -d

# Iniciar em modo desenvolvimento
npm run start:dev
```

## Endpoints

A documentação completa da API está disponível em:
- **Swagger UI**: http://localhost:3000/api/docs

### Auth
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login

### Users
- `GET /api/users/me` - Perfil do usuário atual
- `PATCH /api/users/me` - Atualizar perfil

### Ideas
- `GET /api/ideas` - Listar ideias
- `POST /api/ideas` - Criar ideia
- `GET /api/ideas/:id` - Obter ideia
- `PATCH /api/ideas/:id` - Atualizar ideia
- `DELETE /api/ideas/:id` - Deletar ideia

### Documents
- `GET /api/documents` - Listar documentos
- `POST /api/documents` - Criar documento
- `GET /api/documents/:id` - Obter documento
- `PATCH /api/documents/:id` - Atualizar documento
- `DELETE /api/documents/:id` - Deletar documento
- `POST /api/documents/:id/restore/:versionId` - Restaurar versão

### Prompts
- `GET /api/prompts` - Listar prompts
- `POST /api/prompts` - Criar prompt
- `GET /api/prompts/:id` - Obter prompt
- `PATCH /api/prompts/:id` - Atualizar prompt
- `DELETE /api/prompts/:id` - Deletar prompt
- `POST /api/prompts/:id/use` - Incrementar uso
- `POST /api/prompts/:id/favorite` - Toggle favorito

## Variáveis de Ambiente

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

## Docker

```bash
# Iniciar PostgreSQL + pgAdmin
docker-compose up -d

# pgAdmin disponível em: http://localhost:5050
# Email: admin@ideahub.local
# Senha: admin
```

## Scripts

```bash
npm run start:dev   # Desenvolvimento com hot reload
npm run build       # Build para produção
npm run start:prod  # Produção
npm run lint        # Verificar código
npm run test        # Testes
```
