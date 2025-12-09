import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Board from './pages/Board'
import Catalog from './pages/Catalog'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Loader2 } from 'lucide-react'

// Protected Route Component
const ProtectedRoute = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

// Public Route Component (redirects to home if already logged in)
const PublicRoute = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/board" element={<Board />} />
              <Route path="/catalog" element={<Catalog />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
