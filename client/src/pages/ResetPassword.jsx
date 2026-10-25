import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import Alert from '../components/ui/Alert.jsx'
import api, { errorMessage } from '../services/api.js'
import { validatePassword } from '../utils/validators.js'

export default function ResetPassword() {
  const { token } = useParams()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [done, setDone] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const found = {
      password: validatePassword(form.password),
      confirm: form.confirm === form.password ? '' : 'Passwords do not match.',
    }
    setErrors(found)
    setServerError('')
    if (found.password || found.confirm) return
    setLoading(true)
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password: form.password })
      setDone(res.data.message)
    } catch (err) {
      setServerError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use at least 8 characters, with a letter and a number."
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Back to log in</Link>}
    >
      {done ? (
        <div className="space-y-5">
          <Alert type="success">{done}</Alert>
          <Button to="/login" size="lg" className="w-full">Log in</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-5">
          <Input id="password" type="password" label="New password" autoComplete="new-password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} />
          <Input id="confirm" type="password" label="Confirm new password" autoComplete="new-password"
            value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
          <Alert>{serverError}</Alert>
          <Button type="submit" size="lg" className="w-full" loading={loading}>Reset password</Button>
        </form>
      )}
    </AuthShell>
  )
}
