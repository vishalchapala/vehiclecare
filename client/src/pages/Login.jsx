import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import Alert from '../components/ui/Alert.jsx'
import SlowHint from '../components/ui/SlowHint.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { errorMessage } from '../services/api.js'
import { validateEmail } from '../utils/validators.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = { email: validateEmail(form.email), password: form.password ? '' : 'Enter your password.' }
    setErrors(found)
    setServerError('')
    if (found.email || found.password) return

    setLoading(true)
    try {
      const user = await login(form.email.trim(), form.password)
      navigate(`/${user.role}`, { replace: true })
    } catch (err) {
      setServerError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle="Welcome back. Enter your details to continue."
      footer={
        <>
          New to VehicleCare?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Input id="email" name="email" type="email" label="Email address" autoComplete="email"
          placeholder="you@example.com" value={form.email} onChange={update} error={errors.email} />
        <Input id="password" name="password" type="password" label="Password" autoComplete="current-password"
          value={form.password} onChange={update} error={errors.password} />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand-600 hover:underline">Forgot password?</Link>
        </div>
        <Alert>{serverError}</Alert>
        <SlowHint loading={loading} />
        <Button type="submit" size="lg" className="w-full" loading={loading}>Log in</Button>
      </form>
    </AuthShell>
  )
}
