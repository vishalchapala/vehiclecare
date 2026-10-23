export default function Select({ label, id, error, className = '', children, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">{label}</label>
      <select
        id={id}
        aria-invalid={error ? 'true' : 'false'}
        className={`h-11 w-full rounded-lg border bg-white px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30 ${error ? 'border-red-500' : 'border-slate-300'}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  )
}
