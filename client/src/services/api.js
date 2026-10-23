import axios from 'axios'

// Every request to the backend goes through this one configured client.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
})

// Attach the login token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the server says the token is invalid or expired, log the user out.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    const isAuthForm = url.startsWith('/auth/login') || url.startsWith('/auth/register')
    if (err.response?.status === 401 && !isAuthForm) {
      localStorage.removeItem('vc_token')
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login')
    }
    return Promise.reject(err)
  }
)

// Turns any error into a message that is safe and clear to show on screen.
export const errorMessage = (err) =>
  err.response?.data?.message ||
  (err.request ? 'Cannot reach the server. Check that the backend is running.' : 'Something went wrong')

export default api
