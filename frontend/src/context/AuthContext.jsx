import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password })
    const auth = { token: data.token, userId: data.user?.id, email: data.user?.email ?? email, role: data.user?.role }
    localStorage.setItem('auth', JSON.stringify(auth))
    setUser(auth)
    return auth
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
