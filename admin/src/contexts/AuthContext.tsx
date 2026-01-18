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
  getIdToken: () => Promise<string>
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

function generateMockToken(email: string): string {
  const payload = {
    email,
    role: 'admin',
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
    if (devToken && devEmail) {
      const mockUser: MockUser = {
        uid: `dev_${devEmail}`,
        email: devEmail,
        getIdToken: async () => devToken,
      }
      setUser(mockUser)
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    if (DEV_MODE && MOCK_ADMIN_USERS[email] === password) {
      const token = generateMockToken(email)
      localStorage.setItem('devModeToken', token)
      localStorage.setItem('devModeEmail', email)
      localStorage.setItem('adminToken', token)

      const mockUser: MockUser = {
        uid: `dev_${email}`,
        email,
        getIdToken: async () => token,
      }
      setUser(mockUser)
      console.log('✅ Logged in with dev credentials')
    } else {
      throw new Error('Invalid email or password')
    }
  }

  const logout = async () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('devModeToken')
    localStorage.removeItem('devModeEmail')
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
