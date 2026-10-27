import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import Alert from '../components/ui/Alert.jsx'
import SlowHint from '../components/ui/SlowHint.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { errorMessage } from '../services/api.js'
import { validateName, validateEmail, validatePhone, validatePassword } from '../utils/validators.js'

// Only these two roles can be chosen publicly. Admin accounts are created by a seed script.
const roles = [
  { value: 'customer', title: 'Vehicle owner', text: 'Report breakdowns and book services' },
  { value: 'provider', title: 'Service provider', text: 'Receive and complete requests' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ role: 'customer', name: '', email: '', phone: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      password: validatePassword(form.password),
      confirm: form.confirm === form.password ? '' : 'Passwords do not match.',
    }
    setErrors(found)
    setServerError('')
    if (Object.values(found).some(Boolean)) return

    setLoading(true)
    try {
      const res = await register({
        role: form.role,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/[\s-]/g, ''),
        password: form.password,
      })
      navigate(`/${res.data.user.role}`, { replace: true })
    } catch (err) {
      setServerError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes a minute. You can add your vehicles afterwards."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-800">I am a</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {roles.map((r) => (
              <label
                key={r.value}
                className={`cursor-pointer rounded-lg border p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-400 ${
                  form.role === r.value ? 'border-brand-600 bg-brand-50' : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={update} className="sr-only" />
                <span className="block text-sm font-semibold text-ink">{r.title}</span>
                <span className="mt-0.5 block text-xs text-slate-600">{r.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Input id="name" name="name" label="Full name" autoComplete="name" value={form.name} onChange={update} error={errors.name} />
        <Input id="email" name="email" type="email" label="Email address" autoComplete="email"
          placeholder="you@example.com" value={form.email} onChange={update} error={errors.email} />
        <Input id="phone" name="phone" type="tel" label="Mobile number" autoComplete="tel"
          placeholder="10-digit number" value={form.phone} onChange={update} error={errors.phone} />
        <Input id="password" name="password" type="password" label="Password" autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number." value={form.password} onChange={update} error={errors.password} />
        <Input id="confirm" name="confirm" type="password" label="Confirm password" autoComplete="new-password"
          value={form.confirm} onChange={update} error={errors.confirm} />
        <Alert>{serverError}</Alert>
        <SlowHint loading={loading} />
        <Button type="submit" size="lg" className="w-full" loading={loading}>Create account</Button>
      </form>
    </AuthShell>
  )
}
