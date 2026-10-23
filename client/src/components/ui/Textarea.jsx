export default function Textarea({ label, id, error, hint, className = '', ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">{label}</label>
      <textarea
        id={id}
        rows={4}
        aria-invalid={error ? 'true' : 'false'}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30 ${error ? 'border-red-500' : 'border-slate-300'}`}
        {...props}
      />
      {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : hint ? <p className="mt-1.5 text-sm text-slate-500">{hint}</p> : null}
    </div>
  )
}
