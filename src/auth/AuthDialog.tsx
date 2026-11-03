import { useEffect, useState, type FormEvent } from 'react'
import * as api from '@/api/client'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Modal, ModalBody, ModalHeader } from '@/components/base/modal/modal'
import { useAuth } from './AuthContext'

function errorMessage (err: unknown, mode: 'log-in' | 'sign-up') {
  if (err instanceof api.ApiError) {
    if (err.status === 429) return 'Too many failed logins. Wait 15 minutes and try again.'
    if (err.status === 401) return 'That username and password do not match.'
    if (err.status === 409) return 'That username is taken. Choose another one.'
    if (err.status === 400 && mode === 'log-in') return 'Enter your username and password.'
    if (err.status === 400) return 'Check the fields below and try again.'
  }
  return 'MyPod could not reach the server. Check your connection and try again.'
}

export function AuthDialog () {
  const { dialogMode, openDialog, closeDialog, logIn } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isSignUp = dialogMode === 'sign-up'

  useEffect(() => {
    setError(null)
    setFieldErrors({})
    setPassword('')
  }, [dialogMode])

  // Once a field changes, its old error is out of date. The server checks it
  // again on the next submit.
  function changeField (field: string, setValue: (value: string) => void) {
    return (value: string) => {
      setValue(value)
      setError(null)
      setFieldErrors(({ [field]: _changed, ...others }) => others)
    }
  }

  async function handleSubmit (event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      if (isSignUp) await api.register(username.trim(), email.trim(), password)
      await logIn(username.trim(), password)
      setPassword('')
      closeDialog()
    } catch (err) {
      setError(errorMessage(err, isSignUp ? 'sign-up' : 'log-in'))
      if (err instanceof api.ApiError) {
        setFieldErrors(Object.fromEntries(err.fields.map(({ field, message }) => [field, message])))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal size="sm" isOpen={dialogMode !== null} onOpenChange={(open) => { if (!open) closeDialog() }}>
      <ModalHeader
        title={isSignUp ? 'Create your account' : 'Log in to MyPod'}
        description={isSignUp ? 'An account saves your place in every episode.' : 'Pick up where you stopped.'}
      />
      <ModalBody>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-1">
          {error && <p role="alert" className="text-body-medium text-text-error-primary">{error}</p>}
          <Input
            label="Username"
            autoComplete="username"
            isRequired
            value={username}
            onChange={changeField('username', setUsername)}
            isInvalid={Boolean(fieldErrors.username)}
            errorMessage={fieldErrors.username}
            hint={isSignUp ? '3 to 30 letters, numbers, or _ . -' : undefined}
          />
          {isSignUp && (
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              isRequired
              value={email}
              onChange={changeField('email', setEmail)}
              isInvalid={Boolean(fieldErrors.email)}
              errorMessage={fieldErrors.email}
            />
          )}
          <Input
            label="Password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            isRequired
            value={password}
            onChange={changeField('password', setPassword)}
            isInvalid={Boolean(fieldErrors.password)}
            errorMessage={fieldErrors.password}
            hint={isSignUp ? 'At least 8 characters' : undefined}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full justify-center">
            {isSignUp ? 'Create account' : 'Log in'}
          </Button>
          <p className="text-center text-body-regular text-text-secondary">
            {isSignUp ? 'Already have an account?' : 'New to MyPod?'}{' '}
            <button type="button" onClick={() => openDialog(isSignUp ? 'log-in' : 'sign-up')} className="text-accent-600 underline underline-offset-2">
              {isSignUp ? 'Log in' : 'Create an account'}
            </button>
          </p>
        </form>
      </ModalBody>
    </Modal>
  )
}
