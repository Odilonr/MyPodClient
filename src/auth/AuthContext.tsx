import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as api from '@/api/client'

type AuthStatus = 'checking' | 'guest' | 'signed-in'
type AuthDialogMode = 'log-in' | 'sign-up'

interface AuthValue {
  status: AuthStatus
  dialogMode: AuthDialogMode | null
  openDialog: (mode: AuthDialogMode) => void
  closeDialog: () => void
  logIn: (username: string, password: string) => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider ({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [dialogMode, setDialogMode] = useState<AuthDialogMode | null>(null)

  // The access token is lost on reload, so ask for a new one with the cookie.
  useEffect(() => {
    api.refreshSession().then((ok) => setStatus(ok ? 'signed-in' : 'guest'))
  }, [])

  const logIn = useCallback(async (username: string, password: string) => {
    await api.logIn(username, password)
    setStatus('signed-in')
  }, [])

  const logOut = useCallback(async () => {
    await api.logOut()
    setStatus('guest')
  }, [])

  const openDialog = useCallback((mode: AuthDialogMode) => setDialogMode(mode), [])
  const closeDialog = useCallback(() => setDialogMode(null), [])

  const value = useMemo(
    () => ({ status, dialogMode, openDialog, closeDialog, logIn, logOut }),
    [status, dialogMode, openDialog, closeDialog, logIn, logOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth () {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
