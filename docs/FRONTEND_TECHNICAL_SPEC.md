# IdeaHub MVP - Frontend Technical Specification

**Document Version:** 1.0.0
**Date:** December 11, 2025
**Project:** IdeaHub MVP
**Module:** Frontend Application

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture Patterns](#4-architecture-patterns)
5. [State Management](#5-state-management)
6. [Routing Implementation](#6-routing-implementation)
7. [Component System](#7-component-system)
8. [Form Handling & Validation](#8-form-handling--validation)
9. [API Communication](#9-api-communication)
10. [Styling System](#10-styling-system)
11. [Type Safety](#11-type-safety)
12. [Code Quality Analysis](#12-code-quality-analysis)
13. [Strengths](#13-strengths)
14. [Areas for Improvement](#14-areas-for-improvement)
15. [Recommendations](#15-recommendations)
16. [Glossary](#16-glossary)

---

## 1. Executive Summary

IdeaHub MVP is a modern React application designed for idea management, featuring a Kanban board, document management, and prompt library. The application follows contemporary React patterns with TypeScript for type safety, Context API for state management, and Shadcn/ui for the component library.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Total Pages** | 16 |
| **UI Components** | 70+ |
| **Context Providers** | 4 |
| **Custom Hooks** | 5+ |
| **TypeScript Coverage** | ~100% |
| **Test Coverage** | 0% (no tests) |
| **Estimated LOC** | ~15,000+ |

### Application Features

- **Authentication**: Login/Register with JWT tokens
- **Ideas Management**: CRUD with Kanban board and drag-and-drop
- **Document Management**: Rich text documents with versioning
- **Prompt Library**: Template management with favorites and usage tracking
- **User Profile**: Profile management and settings
- **Localization**: Portuguese (pt-BR) interface

---

## 2. Technology Stack

### 2.1 Core Dependencies

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^6.30.2",
  "typescript": "~5.8.3"
}
```

### 2.2 Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 7.0.0 | Build tool and dev server |
| TypeScript | 5.8.3 | Type checking |
| PostCSS | 8.5.4 | CSS processing |
| Tailwind CSS | 3.4.18 | Utility-first CSS |

### 2.3 UI Framework

```json
{
  "@radix-ui/react-accordion": "^1.2.8",
  "@radix-ui/react-alert-dialog": "^1.1.12",
  "@radix-ui/react-avatar": "^1.1.10",
  "@radix-ui/react-checkbox": "^1.3.2",
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-dropdown-menu": "^2.1.14",
  "@radix-ui/react-label": "^2.1.7",
  "@radix-ui/react-popover": "^1.1.14",
  "@radix-ui/react-scroll-area": "^1.2.9",
  "@radix-ui/react-select": "^2.2.2",
  "@radix-ui/react-separator": "^1.1.7",
  "@radix-ui/react-slider": "^1.3.5",
  "@radix-ui/react-slot": "^1.2.3",
  "@radix-ui/react-switch": "^1.2.5",
  "@radix-ui/react-tabs": "^1.1.12",
  "@radix-ui/react-toast": "^1.2.14",
  "@radix-ui/react-tooltip": "^1.2.7"
}
```

### 2.4 Form & Validation

```json
{
  "react-hook-form": "^7.66.1",
  "@hookform/resolvers": "^5.0.1",
  "zod": "^3.25.76"
}
```

### 2.5 Utility Libraries

```json
{
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.1.0",
  "date-fns": "^4.1.0",
  "lucide-react": "^0.511.0",
  "uuid": "^11.1.0"
}
```

---

## 3. Project Structure

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── components/           # React components
│   │   ├── ui/              # Shadcn/ui base components (70+)
│   │   ├── IdeaCard.tsx     # Domain-specific components
│   │   ├── IdeaModal.tsx
│   │   ├── Navbar.tsx
│   │   └── ...
│   ├── context/             # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── IdeaContext.tsx
│   │   ├── DocsContext.tsx
│   │   └── PromptContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── use-toast.ts
│   │   ├── use-mobile.tsx
│   │   └── ...
│   ├── lib/                 # Utility functions
│   │   ├── utils.ts
│   │   └── apiClient.ts
│   ├── pages/               # Route page components
│   │   ├── Index.tsx
│   │   ├── Board.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ... (16 pages)
│   ├── services/            # API service layer
│   │   ├── authService.ts
│   │   ├── ideaService.ts
│   │   ├── documentService.ts
│   │   └── promptService.ts
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── components.json          # Shadcn/ui configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── package.json
```

---

## 4. Architecture Patterns

### 4.1 Component Architecture

The application follows a **layered component architecture**:

```
┌─────────────────────────────────────────────────────┐
│                    Pages Layer                       │
│   (Index, Board, Login, Profile, etc.)              │
├─────────────────────────────────────────────────────┤
│               Domain Components Layer                │
│   (IdeaCard, IdeaModal, Navbar, etc.)               │
├─────────────────────────────────────────────────────┤
│                 UI Components Layer                  │
│   (Button, Input, Card, Dialog - Shadcn/ui)         │
├─────────────────────────────────────────────────────┤
│              Context & Hooks Layer                   │
│   (AuthContext, IdeaContext, useToast, etc.)        │
├─────────────────────────────────────────────────────┤
│                 Services Layer                       │
│   (authService, ideaService, apiClient)             │
└─────────────────────────────────────────────────────┘
```

### 4.2 Data Flow Pattern

```
┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Page   │───▶│   Context   │───▶│   Service    │───▶│  API/Local  │
│Component│    │  Provider   │    │   Layer      │    │  Storage    │
└─────────┘    └─────────────┘    └──────────────┘    └─────────────┘
     ▲                │
     │                │
     └────────────────┘
       State Updates
```

### 4.3 Composition Pattern Example

```typescript
// src/pages/Board.tsx - Demonstrates composition pattern
const Board = () => {
  const { ideas, updateIdea, isLoading } = useIdeas()  // Context consumption
  const { toast } = useToast()                          // Custom hook
  const [draggedIdeaId, setDraggedIdeaId] = useState<string | null>(null)

  // Loading state handling
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 w-full">
      <div className="flex h-full p-4 gap-4">
        {COLUMNS.map((status) => (
          <div key={status} className="flex flex-col w-80 shrink-0">
            {/* Column content with drag-drop */}
            {columnIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onClick={() => openEditModal(idea.id)}
                isDraggable
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
```

---

## 5. State Management

### 5.1 Context API Implementation

The application uses **React Context API** for global state management instead of Redux or other state management libraries.

#### Context Providers Structure

```typescript
// src/App.tsx - Provider hierarchy
<AuthProvider>
  <BrowserRouter>
    <Routes>
      {/* Routes wrapped in AuthProvider */}
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

### 5.2 AuthContext Implementation

```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: { name?: string; email?: string; avatar?: string }) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const userData = await authService.login(email, password)
      setUser(userData)
      toast({ title: 'Login realizado!', description: 'Bem-vindo de volta!' })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro no login',
        description: error.message || 'Verifique suas credenciais.',
      })
      throw error
    }
  }

  // ... other methods

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook with error boundary
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### 5.3 IdeaContext with Optimistic Updates

```typescript
// src/context/IdeaContext.tsx
interface IdeaContextType {
  ideas: Idea[]
  tags: Tag[]
  isLoading: boolean
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore' | 'userId'>) => Promise<void>
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>
  refreshIdeas: () => Promise<void>
  createTag: (name: string) => Promise<Tag>
  getEvents: (ideaId: string) => Promise<IdeaTimelineEvent[]>
}

// Optimistic update pattern
const updateIdea = useCallback(
  async (id: string, updates: Partial<Idea>) => {
    try {
      // Optimistic update - immediately update UI
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === id
            ? { ...idea, ...updates, updatedAt: new Date().toISOString() }
            : idea,
        ),
      )

      // Server sync
      const updated = await ideaService.updateIdea(id, updates)

      // Reconcile with server response (important for calculated fields)
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === id ? updated : idea)),
      )
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao atualizar ideia.',
      })
      loadData() // Revert on error
    }
  },
  [loadData, toast],
)
```

### 5.4 State Management Comparison

| Aspect | Current (Context API) | Alternative (Redux) |
|--------|----------------------|---------------------|
| **Complexity** | Low | High |
| **Bundle Size** | 0 KB extra | ~15 KB |
| **DevTools** | React DevTools | Redux DevTools |
| **Boilerplate** | Minimal | Significant |
| **Performance** | Good for small apps | Better for large apps |
| **Learning Curve** | Low | Medium-High |

---

## 6. Routing Implementation

### 6.1 React Router v6 Configuration

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'

// Protected Route Guard
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// Public Route Guard (redirects authenticated users)
const PublicRoute = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
```

### 6.2 Route Structure

```typescript
// src/App.tsx - Complete route configuration
<Routes>
  {/* Public routes - redirect if authenticated */}
  <Route element={<PublicRoute />}>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
  </Route>

  {/* Protected routes - require authentication */}
  <Route element={<ProtectedRoute />}>
    <Route element={<MainLayout />}>
      <Route path="/" element={<Index />} />
      <Route path="/board" element={<Board />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/docs/:docId" element={<Documentation />} />
      <Route path="/prompts" element={<PromptLibrary />} />
      <Route path="/prompts/generator" element={<PromptGeneratorPage />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/idea/:id" element={<IdeaDetail />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/health" element={<SystemHealth />} />
    </Route>
  </Route>

  {/* Test routes (development only) */}
  <Route path="/test/load" element={<LoadTest />} />
  <Route path="/test/persistence" element={<PersistenceTest />} />

  {/* 404 handler */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

### 6.3 Route Pages Overview

| Route | Page Component | Description |
|-------|----------------|-------------|
| `/` | Index | Dashboard/Home page |
| `/board` | Board | Kanban board view |
| `/docs` | Docs | Document list |
| `/docs/:docId` | Documentation | Document editor |
| `/prompts` | PromptLibrary | Prompt templates |
| `/prompts/generator` | PromptGeneratorPage | AI prompt generator |
| `/catalog` | Catalog | Ideas catalog view |
| `/idea/:id` | IdeaDetail | Single idea detail |
| `/resume` | Resume | Summary/Reports |
| `/profile` | Profile | User settings |
| `/health` | SystemHealth | System diagnostics |
| `/login` | Login | Authentication |
| `/register` | Register | User registration |
| `*` | NotFound | 404 page |

---

## 7. Component System

### 7.1 Shadcn/ui Integration

The project uses **Shadcn/ui** - a collection of re-usable components built with Radix UI and Tailwind CSS.

#### Configuration

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 7.2 Class Variance Authority (CVA) Pattern

```typescript
// src/components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
```

### 7.3 UI Components Inventory

| Category | Components |
|----------|------------|
| **Layout** | Card, Separator, ScrollArea, Sheet, Sidebar |
| **Forms** | Input, Textarea, Select, Checkbox, Switch, Slider, Form |
| **Feedback** | Toast, Alert, AlertDialog, Progress, Skeleton |
| **Navigation** | Tabs, Accordion, Dropdown, Popover, Tooltip |
| **Data Display** | Avatar, Badge, Table |
| **Overlay** | Dialog, Sheet, Popover |
| **Typography** | Label |

### 7.4 Domain Component Example

```typescript
// src/components/IdeaCard.tsx
interface IdeaCardProps {
  idea: Idea
  onClick?: () => void
  isDraggable?: boolean
  onDragStart?: (e: React.DragEvent, id: string) => void
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  onClick,
  isDraggable = false,
  onDragStart,
}) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isDraggable && 'cursor-grab active:cursor-grabbing'
      )}
      draggable={isDraggable}
      onDragStart={(e) => onDragStart?.(e, idea.id)}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-medium line-clamp-2">
          {idea.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {idea.summary}
        </p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {idea.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 8. Form Handling & Validation

### 8.1 React Hook Form + Zod Integration

The application uses **React Hook Form** for form state management and **Zod** for schema validation.

#### Login Form Example

```typescript
// src/pages/Login.tsx
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

// Schema definition with validation messages in Portuguese
const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

// Type inference from schema
type LoginFormValues = z.infer<typeof loginSchema>

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // Form initialization with Zod resolver
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    try {
      await login(values.email, values.password)
      navigate('/')
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  placeholder="nome@exemplo.com"
                  type="email"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage /> {/* Displays Zod validation errors */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  placeholder="••••••••"
                  type="password"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="animate-spin" /> : 'Entrar'}
        </Button>
      </form>
    </Form>
  )
}
```

### 8.2 Form Component Structure

```
Form (react-hook-form FormProvider)
├── FormField (field-level control)
│   ├── FormItem (wrapper with spacing)
│   │   ├── FormLabel (accessible label)
│   │   ├── FormControl (input wrapper)
│   │   │   └── Input/Select/etc. (actual input)
│   │   ├── FormDescription (helper text)
│   │   └── FormMessage (validation error)
```

### 8.3 Validation Patterns Used

| Pattern | Example | Use Case |
|---------|---------|----------|
| **Required** | `z.string().min(1, 'Required')` | Mandatory fields |
| **Email** | `z.string().email('Invalid email')` | Email validation |
| **Min Length** | `z.string().min(6, 'Min 6 chars')` | Password length |
| **Optional** | `z.string().optional()` | Optional fields |
| **Enum** | `z.enum(['a', 'b', 'c'])` | Select options |
| **Array** | `z.array(z.string())` | Multi-select |

---

## 9. API Communication

### 9.1 Dual-Mode Architecture

The application supports two modes of operation:
1. **Mock Mode**: Uses localStorage for data persistence (development/demo)
2. **Backend Mode**: Connects to real NestJS API

```typescript
// src/lib/apiClient.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Environment detection
export const isBackendMode = () => import.meta.env.VITE_USE_BACKEND === 'true'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor() {
    this.baseUrl = API_BASE_URL
    // Restore token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    return headers
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }
}

export const apiClient = new ApiClient()
```

### 9.2 Service Layer Pattern

```typescript
// src/services/ideaService.ts
import { apiClient, isBackendMode } from '@/lib/apiClient'
import { Idea, Tag, IdeaTimelineEvent } from '@/types'
import { v4 as uuidv4 } from 'uuid'

const STORAGE_KEY = 'ideahub_ideas'
const TAGS_STORAGE_KEY = 'ideahub_tags'

class IdeaService {
  // CRUD Operations with mode detection
  async getIdeas(userId: string): Promise<Idea[]> {
    if (isBackendMode()) {
      return apiClient.get<Idea[]>('/ideas')
    }

    // localStorage fallback
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const ideas: Idea[] = JSON.parse(stored)
      return ideas.filter((idea) => idea.userId === userId)
    }
    return []
  }

  async createIdea(idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'priorityScore'>): Promise<Idea> {
    if (isBackendMode()) {
      return apiClient.post<Idea>('/ideas', idea)
    }

    // localStorage fallback with priority calculation
    const newIdea: Idea = {
      ...idea,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      priorityScore: this.calculatePriorityScore(idea.impact, idea.effort),
    }

    const ideas = await this.getAllIdeas()
    ideas.push(newIdea)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))

    return newIdea
  }

  async updateIdea(id: string, updates: Partial<Idea>): Promise<Idea> {
    if (isBackendMode()) {
      return apiClient.put<Idea>(`/ideas/${id}`, updates)
    }

    // localStorage fallback
    const ideas = await this.getAllIdeas()
    const index = ideas.findIndex((i) => i.id === id)

    if (index === -1) throw new Error('Idea not found')

    const updatedIdea: Idea = {
      ...ideas[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    // Recalculate priority if impact or effort changed
    if (updates.impact !== undefined || updates.effort !== undefined) {
      updatedIdea.priorityScore = this.calculatePriorityScore(
        updatedIdea.impact,
        updatedIdea.effort,
      )
    }

    ideas[index] = updatedIdea
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas))

    return updatedIdea
  }

  // Priority score calculation (RICE-inspired)
  private calculatePriorityScore(impact: number, effort: number): number {
    if (effort === 0) return 0
    return Math.round((impact / effort) * 100) / 100
  }
}

export const ideaService = new IdeaService()
```

### 9.3 API Endpoints Mapping

| Service Method | Backend Mode Endpoint | Local Mode |
|----------------|----------------------|------------|
| `getIdeas` | `GET /ideas` | localStorage |
| `createIdea` | `POST /ideas` | localStorage + UUID |
| `updateIdea` | `PUT /ideas/:id` | localStorage |
| `deleteIdea` | `DELETE /ideas/:id` | localStorage |
| `login` | `POST /auth/login` | localStorage mock |
| `register` | `POST /auth/register` | localStorage mock |

---

## 10. Styling System

### 10.1 Tailwind CSS Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // HSL-based semantic color system
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
```

### 10.2 CSS Variables (Dark Mode Support)

```css
/* src/index.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    /* ... dark mode variables */
  }
}
```

### 10.3 Utility Function for Class Merging

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Usage example
<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'primary' && 'primary-classes'
)} />
```

---

## 11. Type Safety

### 11.1 Core Type Definitions

```typescript
// src/types/index.ts

// User Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

// Idea Status as Union Type
export type IdeaStatus =
  | 'inbox'
  | 'nova_ideia'
  | 'em_analise'
  | 'mvp'
  | 'backlog'
  | 'em_andamento'
  | 'entregue'
  | 'arquivada'

// Status Labels (Portuguese localization)
export const STATUS_LABELS: Record<IdeaStatus, string> = {
  inbox: 'Inbox',
  nova_ideia: 'Nova Ideia',
  em_analise: 'Em Análise',
  mvp: 'MVP',
  backlog: 'Backlog',
  em_andamento: 'Em Andamento',
  entregue: 'Entregue',
  arquivada: 'Arquivada',
}

// Category Types
export type IdeaCategory =
  | 'produto'
  | 'processo'
  | 'marketing'
  | 'tecnologia'
  | 'negocio'
  | 'outro'

export const CATEGORY_LABELS: Record<IdeaCategory, string> = {
  produto: 'Produto',
  processo: 'Processo',
  marketing: 'Marketing',
  tecnologia: 'Tecnologia',
  negocio: 'Negócio',
  outro: 'Outro',
}

// Main Idea Interface
export interface Idea {
  id: string
  userId: string
  title: string
  summary: string
  description?: string
  status: IdeaStatus
  category: IdeaCategory
  impact: number      // 1-10 scale
  effort: number      // 1-10 scale
  priorityScore: number  // Calculated: impact/effort
  tags: Tag[]
  attachments?: Attachment[]
  createdAt: string
  updatedAt: string
}

// Tag Interface
export interface Tag {
  id: string
  name: string
  color?: string
}

// Timeline Event Interface
export interface IdeaTimelineEvent {
  id: string
  ideaId: string
  type: 'status_change' | 'comment' | 'attachment' | 'edit'
  description: string
  oldValue?: string
  newValue?: string
  createdAt: string
  createdBy: string
}

// Document Types
export interface Document {
  id: string
  userId: string
  title: string
  content: string
  version: number
  parentId?: string  // For document hierarchy
  tags: Tag[]
  createdAt: string
  updatedAt: string
}

// Prompt Types
export interface Prompt {
  id: string
  userId: string
  title: string
  content: string
  category: string
  tags: string[]
  isFavorite: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

// Pagination Response
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}
```

### 11.2 TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

### 11.3 Type Safety Patterns Used

| Pattern | Example | Benefit |
|---------|---------|---------|
| **Interface** | `interface User { ... }` | Object shape definition |
| **Union Types** | `type Status = 'a' \| 'b'` | Exhaustive type checking |
| **Generic Types** | `PaginatedResponse<T>` | Reusable type patterns |
| **Type Inference** | `z.infer<typeof schema>` | DRY validation types |
| **Record Types** | `Record<Status, string>` | Type-safe mappings |
| **Omit/Pick** | `Omit<Idea, 'id'>` | Partial type creation |

---

## 12. Code Quality Analysis

### 12.1 Metrics Overview

| Metric | Value | Assessment |
|--------|-------|------------|
| **TypeScript Strict Mode** | Enabled | Excellent |
| **ESLint Configuration** | Standard | Good |
| **Test Coverage** | 0% | Critical Gap |
| **Bundle Size** | ~500KB (estimated) | Acceptable |
| **Component Reusability** | High | Excellent |
| **Code Duplication** | Low | Good |

### 12.2 Code Patterns Analysis

#### Positive Patterns

1. **Consistent Hook Usage**
```typescript
// Good: Proper useCallback for event handlers
const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
  setDraggedIdeaId(id)
  e.dataTransfer.effectAllowed = 'move'
}, [])
```

2. **Error Boundary Pattern in Context**
```typescript
// Good: Error checking in custom hooks
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

3. **Loading State Handling**
```typescript
// Good: Proper loading state UI
if (isLoading) {
  return (
    <div className="flex justify-center items-center">
      <Loader2 className="animate-spin" />
    </div>
  )
}
```

#### Areas of Concern

1. **No Error Boundaries** - Missing React Error Boundaries for graceful failure handling

2. **Console.error Usage** - Using console.error instead of proper logging service
```typescript
// Current
} catch (error) {
  console.error('Failed to load data', error)
}

// Recommended
} catch (error) {
  logger.error('Failed to load data', { error, context: 'IdeaContext' })
}
```

3. **Missing Accessibility Attributes** - Some interactive elements lack proper ARIA labels

---

## 13. Strengths

### 13.1 Architecture Strengths

| Strength | Description |
|----------|-------------|
| **Modern Stack** | React 19, TypeScript 5.9, Vite 7 - cutting edge |
| **Type Safety** | Full TypeScript coverage with strict mode |
| **Component Library** | Shadcn/ui provides consistent, accessible components |
| **Form Handling** | React Hook Form + Zod is industry best practice |
| **Optimistic Updates** | Improves perceived performance |
| **Dual-Mode API** | Enables development without backend |

### 13.2 Code Quality Strengths

1. **Consistent Code Style** - Follows established patterns throughout
2. **Clear Separation of Concerns** - Services, contexts, components well organized
3. **Portuguese Localization** - All user-facing text properly localized
4. **Responsive Design** - Mobile-first approach with Tailwind
5. **Dark Mode Support** - CSS variables enable theming

### 13.3 Developer Experience

- **Path Aliases** (`@/`) for clean imports
- **Hot Module Replacement** with Vite
- **Type Inference** reduces boilerplate
- **Component Composition** promotes reusability

---

## 14. Areas for Improvement

### 14.1 Critical Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **No Tests** | Critical | Zero confidence in refactoring |
| **No Error Boundaries** | High | Unhandled errors crash app |
| **No Logging Service** | Medium | Debugging difficulties |
| **No i18n Framework** | Low | Hardcoded Portuguese strings |

### 14.2 Missing Features

1. **Testing Infrastructure**
   - Unit tests (Jest + React Testing Library)
   - Integration tests
   - E2E tests (Cypress/Playwright)

2. **Error Handling**
   - Global error boundary
   - Error tracking service (Sentry)
   - User-friendly error messages

3. **Performance Optimizations**
   - React.memo for expensive components
   - Code splitting/lazy loading
   - Image optimization

4. **Accessibility**
   - ARIA labels audit
   - Keyboard navigation testing
   - Screen reader testing

### 14.3 Code Improvements

```typescript
// Current: Missing error boundary
<App />

// Recommended: With error boundary
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

```typescript
// Current: Direct console.error
console.error('Failed to load', error)

// Recommended: Structured logging
import { logger } from '@/lib/logger'
logger.error('Failed to load', { error, userId, action: 'loadIdeas' })
```

---

## 15. Recommendations

### 15.1 Immediate Actions (Priority: High)

1. **Add Testing Framework**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

2. **Create Error Boundary Component**
```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    errorService.capture(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }
    return this.props.children
  }
}
```

3. **Implement Code Splitting**
```typescript
// src/App.tsx
const Board = lazy(() => import('./pages/Board'))
const Docs = lazy(() => import('./pages/Docs'))

// In routes
<Suspense fallback={<PageLoader />}>
  <Route path="/board" element={<Board />} />
</Suspense>
```

### 15.2 Medium-Term Actions

1. **Add Internationalization (i18n)**
   - Use react-i18next
   - Extract all strings to translation files

2. **Implement Performance Monitoring**
   - Add React Profiler in development
   - Integrate performance monitoring service

3. **Accessibility Audit**
   - Run axe-core accessibility tests
   - Add keyboard navigation tests

### 15.3 Long-Term Considerations

1. **State Management Evolution**
   - Consider Zustand or Jotai for complex state
   - Evaluate React Query for server state

2. **Build Optimization**
   - Analyze bundle size with rollup-plugin-visualizer
   - Implement tree-shaking verification

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **CVA** | Class Variance Authority - utility for creating variant-based components |
| **HSL** | Hue, Saturation, Lightness - color model used for theming |
| **Optimistic Update** | UI updates before server confirmation for perceived speed |
| **Radix UI** | Unstyled, accessible UI component primitives |
| **Shadcn/ui** | Collection of re-usable components built on Radix + Tailwind |
| **Zod** | TypeScript-first schema validation library |
| **Context API** | React's built-in state management solution |
| **React Hook Form** | Performant form library with minimal re-renders |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-11 | Claude Code | Initial document |

---

*This document was generated for frontend evaluation purposes. For questions or clarifications, please refer to the codebase at `frontend/src/`.*
