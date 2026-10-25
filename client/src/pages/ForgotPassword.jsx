import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import Alert from '../components/ui/Alert.jsx'
import api, { errorMessage } from '../services/api.js'
import { validateEmail } from '../utils/validators.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const problem = validateEmail(email)
    setError(problem)
    setSent('')
    if (problem) return
    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() })
      setSent(res.data.message)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to choose a new one."
      footer={<>Remembered it? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input id="email" type="email" label="Email address" autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
        <Alert type="success">{sent}</Alert>
        <Button type="submit" size="lg" className="w-full" loading={loading}>Send reset link</Button>
        <p className="text-sm text-slate-600">
          Did not get an email? Ask the VehicleCare admin to reset your password. They will give you a temporary one that you can change on your Profile page.
        </p>
      </form>
    </AuthShell>
  )
}
