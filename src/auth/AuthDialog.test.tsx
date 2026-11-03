import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { AuthDialog } from './AuthDialog'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

function OpenSignUp () {
  const { openDialog } = useAuth()
  useEffect(() => openDialog('sign-up'), [openDialog])
  return null
}

async function submitBadUsername () {
  const user = userEvent.setup()
  render(<AuthProvider><OpenSignUp /><AuthDialog /></AuthProvider>)
  await user.type(await screen.findByLabelText(/Username/), 'two words')
  await user.type(screen.getByLabelText(/Email/), 'listener@example.com')
  await user.type(screen.getByLabelText(/Password/), 'correct-horse')
  await user.click(screen.getByRole('button', { name: 'Create account' }))
  await screen.findByText('Username can only use letters, numbers, _ . and -')
  return user
}

describe('AuthDialog', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/user/refresh')) return new Response(null, { status: 400 })
      if (url.endsWith('/user/register')) {
        return json({ message: 'Invalid registration data', error: [{ field: 'username', message: 'Username can only use letters, numbers, _ . and -' }] }, 400)
      }
      return json({})
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  it('shows the error from the server on the field it belongs to', async () => {
    await submitBadUsername()
    expect(screen.getByLabelText(/Username/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/Email/)).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('stops showing a field as wrong as soon as the user changes it', async () => {
    const user = await submitBadUsername()
    await user.type(screen.getByLabelText(/Username/), '_fixed')
    await waitFor(() => {
      expect(screen.getByLabelText(/Username/)).not.toHaveAttribute('aria-invalid', 'true')
    })
    expect(screen.queryByText('Username can only use letters, numbers, _ . and -')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
