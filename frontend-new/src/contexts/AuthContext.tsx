import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'react-toastify'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'client' | 'supplier' | 'admin' | 'service_provider'
  companyName?: string
  jobTitle?: string
  organizationType?: string
  forcePasswordChange?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  clearForcePasswordChange: () => void
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  role: 'client' | 'supplier' | 'admin' | 'service_provider'
  companyName: string
  jobTitle: string
  organizationType?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth token on app load
    const token = localStorage.getItem('authToken')
    
    if (token) {
      verifyToken(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken')
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('authToken')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('authToken', data.token)
        setUser(data.user)
        toast.success('Login successful!')
      } else {
        toast.error(data.message || 'Login failed. Please check your credentials.')
        throw new Error(data.message || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Login failed. Please try again.')
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('authToken', data.token)
        setUser(data.user)
        toast.success('Registration successful!')
      } else {
        toast.error(data.message || 'Registration failed. Please try again.')
        throw new Error(data.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Registration failed. Please try again.')
      }
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('userData')
    setUser(null)
    toast.success('Logged out successfully!')
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      await verifyToken(token)
    }
  }

  const clearForcePasswordChange = () => {
    if (user) {
      setUser({
        ...user,
        forcePasswordChange: false
      })
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    clearForcePasswordChange
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}