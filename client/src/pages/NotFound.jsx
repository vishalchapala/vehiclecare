import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-bold tracking-tight">This page doesn't exist</h1>
      <p className="mt-3 text-slate-600">
        The link may be broken, or the page may have moved. Go back to the home page to continue.
      </p>
      <Button to="/" className="mt-8">Go to home page</Button>
    </section>
  )
}
