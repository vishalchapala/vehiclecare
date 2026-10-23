import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-600/60',
  secondary: 'bg-white text-ink border border-slate-300 hover:bg-slate-50 disabled:opacity-60',
  ghost: 'text-slate-200 hover:bg-white/10',
  outlineLight: 'border border-white/25 text-white hover:bg-white/10',
}

const sizes = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

/**
 * Reusable button. Pass `to` to render a router link that looks like a button.
 * Pass `loading` to show a spinner and block repeat clicks.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  to,
  loading = false,
  className = '',
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={classes} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
