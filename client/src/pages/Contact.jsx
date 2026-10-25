import { useState } from 'react'
import api, { errorMessage } from '../services/api.js'
import { validateName, validateEmail } from '../utils/validators.js'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Textarea from '../components/ui/Textarea.jsx'
import Alert from '../components/ui/Alert.jsx'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [sending, setSending] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const found = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      message: form.message.trim().length >= 10 ? '' : 'Write at least 10 characters.',
    }
    setErrors(found)
    setMsg({ type: '', text: '' })
    if (Object.values(found).some(Boolean)) return
    setSending(true)
    try {
      const res = await api.post('/contact', { name: form.name.trim(), email: form.email.trim(), message: form.message })
      setForm({ name: '', email: '', message: '' })
      setMsg({ type: 'success', text: res.data.message })
    } catch (err) {
      setMsg({ type: 'error', text: errorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-20">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink">Contact us</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">
          Questions or feedback about VehicleCare? Send us a message and the team will read it.
        </p>
        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          <Input id="name" name="name" label="Your name" value={form.name} onChange={update} error={errors.name} />
          <Input id="email" name="email" type="email" label="Email address" value={form.email} onChange={update} error={errors.email} />
          <Textarea id="message" name="message" rows={5} label="Message" value={form.message} onChange={update} error={errors.message} />
          <Alert type={msg.type === 'success' ? 'success' : 'error'}>{msg.text}</Alert>
          <Button type="submit" size="lg" loading={sending}>Send message</Button>
        </form>
      </div>
    </section>
  )
}
