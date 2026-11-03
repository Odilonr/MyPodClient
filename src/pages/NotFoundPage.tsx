import { Link } from 'react-router'

export function NotFoundPage () {
  return (
    <div className="py-12">
      <h1 className="mb-2 font-display text-[40px] font-bold tracking-tight">This page does not exist</h1>
      <Link to="/" className="text-body-medium text-accent-600 underline underline-offset-2">Browse all shows</Link>
    </div>
  )
}
