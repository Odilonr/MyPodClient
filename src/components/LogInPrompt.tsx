import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/base/buttons/button'

export function LogInPrompt ({ message }: { message: string }) {
  const { status, openDialog } = useAuth()
  if (status === 'checking') return null

  return (
    <div className="py-6">
      <p className="mb-3 max-w-[60ch] text-body-regular text-text-secondary">{message}</p>
      <div className="flex gap-2">
        <Button onClick={() => openDialog('log-in')}>Log in</Button>
        <Button variant="secondary" onClick={() => openDialog('sign-up')}>Create account</Button>
      </div>
    </div>
  )
}
