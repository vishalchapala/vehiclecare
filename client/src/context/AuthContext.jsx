import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // We only need to wait if a saved token exists and must be checked with the server.
  const [loading, setLoading] = useState(!!localStorage.getItem('vc_token'))

  useEffect(() => {
    if (!localStorage.getItem('vc_token')) return
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.data.user))
      .catch(() => localStorage.removeItem('vc_token'))
      .finally(() => setLoading(false))
  }, [])

  const save = (data) => {
    localStorage.setItem('vc_token', data.token)
    setUser(data.user)
    return data.user
  }

  const login = async (email, password) => save((await api.post('/auth/login', { email, password })).data.data)

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload)
    save(res.data.data)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('vc_token')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
