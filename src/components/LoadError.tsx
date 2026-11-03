import { Button } from '@/components/base/buttons/button'

export function LoadError ({ message, onRetry }: { message: string, onRetry: () => void }) {
  return (
    <div role="alert" className="py-8">
      <p className="mb-3 text-body-regular text-text-secondary">{message}</p>
      <Button variant="secondary" size="small" onClick={onRetry}>Try again</Button>
    </div>
  )
}
