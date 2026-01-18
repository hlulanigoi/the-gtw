import { createContext, useContext, useEffect, useState } from 'react'

// Development mode credentials
const DEV_MODE = true
const MOCK_ADMIN_USERS: Record<string, { password: string; role: 'admin' | 'support' }> = {
  'admin@parcelpeer.com': { password: 'Admin@123456', role: 'admin' },
  'test@parcelpeer.com': { password: 'Test@123456', role: 'admin' },
  'support@parcelpeer.com': { password: 'Support@123456', role: 'support' },
}

interface MockUser {
  uid: string
  email: string
  role: 'admin' | 'support'
  getIdToken: () => Promise<string>
}

type UserRole = 'admin' | 'support'
type Permission = 
  | 'view_dashboard'
  | 'view_users'
  | 'verify_users'
  | 'delete_users'
  | 'view_parcels'
  | 'update_parcel_status'
  | 'delete_parcels'
  | 'view_routes'
  | 'update_routes'
  | 'delete_routes'
  | 'view_payments'
  | 'process_refunds'
  | 'view_disputes'
  | 'comment_disputes'
  | 'resolve_disputes'
  | 'view_subscriptions'
  | 'cancel_subscriptions'
  | 'view_reviews'
  | 'moderate_reviews'
  | 'delete_reviews'
  | 'view_wallet'
  | 'adjust_wallets'
  | 'access_settings'

// Role-based permissions mapping (matches backend)
const rolePermissions: Record<UserRole, Permission[]> = {
  support: [
    'view_dashboard',
    'view_users',
    'verify_users',
    'view_parcels',
    'update_parcel_status',
    'view_routes',
    'view_payments',
    'view_disputes',
    'comment_disputes',
    'view_subscriptions',
    'view_reviews',
    'moderate_reviews',
    'delete_reviews',
    'view_wallet',
  ],
  admin: [
    'view_dashboard',
    'view_users',
    'verify_users',
    'delete_users',
    'view_parcels',
    'update_parcel_status',
    'delete_parcels',
    'view_routes',
    'update_routes',
    'delete_routes',
    'view_payments',
    'process_refunds',
    'view_disputes',
    'comment_disputes',
    'resolve_disputes',
    'view_subscriptions',
    'cancel_subscriptions',
    'view_reviews',
    'moderate_reviews',
    'delete_reviews',
    'view_wallet',
    'adjust_wallets',
    'access_settings',
  ],
}

/**
 * Check if user has permission
 */
export function hasPermission(user: MockUser | null, permission: Permission): boolean {
  if (!user) return false
  const permissions = rolePermissions[user.role] || []
  return permissions.includes(permission)
}

/**
 * Check if user is admin
 */
export function isAdmin(user: MockUser | null): boolean {
  return user?.role === 'admin'
}

/**
 * Check if user is support
 */
export function isSupport(user: MockUser | null): boolean {
  return user?.role === 'support'
}

interface AuthContextType {
  user: MockUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getToken: () => Promise<string | null>
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function generateMockToken(email: string, role: 'admin' | 'support'): string {
  const payload = {
    email,
    role,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000,
  }
  return `mock_token_${btoa(JSON.stringify(payload))}`
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing dev mode session on mount
    const devToken = localStorage.getItem('devModeToken')
    const devEmail = localStorage.getItem('devModeEmail')
    const devRole = localStorage.getItem('devModeRole') as 'admin' | 'support' | null
    if (devToken && devEmail && devRole) {
      const mockUser: MockUser = {
        uid: `dev_${devEmail}`,
        email: devEmail,
        role: devRole,
        getIdToken: async () => devToken,
      }
      setUser(mockUser)
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const userConfig = MOCK_ADMIN_USERS[email]
    if (DEV_MODE && userConfig && userConfig.password === password) {
      const token = generateMockToken(email, userConfig.role)
      localStorage.setItem('devModeToken', token)
      localStorage.setItem('devModeEmail', email)
      localStorage.setItem('devModeRole', userConfig.role)
      localStorage.setItem('adminToken', token)

      const mockUser: MockUser = {
        uid: `dev_${email}`,
        email,
        role: userConfig.role,
        getIdToken: async () => token,
      }
      setUser(mockUser)
      console.log(`✅ Logged in as ${userConfig.role}`)
    } else {
      throw new Error('Invalid email or password')
    }
  }

  const logout = async () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('devModeToken')
    localStorage.removeItem('devModeEmail')
    localStorage.removeItem('devModeRole')
    setUser(null)
  }

  const getToken = async () => {
    if (!user) return null
    try {
      if ('getIdToken' in user && typeof user.getIdToken === 'function') {
        return await user.getIdToken()
      }
      return localStorage.getItem('adminToken')
    } catch (error) {
      console.error('Failed to get token:', error)
      return null
    }
  }

  const getIdToken = async () => {
    return getToken()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken, getIdToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
