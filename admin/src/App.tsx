import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { lazy, Suspense } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { SkeletonTable } from './components/Skeleton'
import Layout from './components/Layout'

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Users = lazy(() => import('./pages/Users'))
const UserDetail = lazy(() => import('./pages/UserDetail'))
const Parcels = lazy(() => import('./pages/Parcels'))
const RoutesPage = lazy(() => import('./pages/Routes'))
const Payments = lazy(() => import('./pages/Payments'))
const Reviews = lazy(() => import('./pages/Reviews'))
const Disputes = lazy(() => import('./pages/Disputes'))
const Subscriptions = lazy(() => import('./pages/Subscriptions'))
const WalletTransactions = lazy(() => import('./pages/WalletTransactions'))
const Settings = lazy(() => import('./pages/Settings'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
    },
  },
})

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader />
  }

  return user ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Layout />
                      </PrivateRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="users" element={<Users />} />
                    <Route path="users/:id" element={<UserDetail />} />
                    <Route path="parcels" element={<Parcels />} />
                    <Route path="routes" element={<RoutesPage />} />
                    <Route path="payments" element={<Payments />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="disputes" element={<Disputes />} />
                    <Route path="subscriptions" element={<Subscriptions />} />
                    <Route path="wallet" element={<WalletTransactions />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
