import { createContext, useContext, useEffect, useState } from 'react'
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { fetchWithAuth } from '../lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken()
          localStorage.setItem('adminToken', token)
          
          // Verify user is admin
          const userData = await fetchWithAuth('/auth/me')
          if (userData.role === 'admin') {
            setUser(firebaseUser)
          } else {
            await signOut(auth)
            localStorage.removeItem('adminToken')
            setUser(null)
            alert('Access denied: Admin privileges required')
          }
        } catch (error) {
          console.error('Auth error:', error)
          setUser(null)
        }
      } else {
        setUser(null)
        localStorage.removeItem('adminToken')
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const token = await userCredential.user.getIdToken()
    localStorage.setItem('adminToken', token)
    
    // Verify admin access
    const userData = await fetchWithAuth('/auth/me')
    if (userData.role !== 'admin') {
      await signOut(auth)
      localStorage.removeItem('adminToken')
      throw new Error('Access denied: Admin privileges required')
    }
  }

  const logout = async () => {
    await signOut(auth)
    localStorage.removeItem('adminToken')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
