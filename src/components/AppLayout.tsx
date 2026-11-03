import { RiUser3Line } from '@remixicon/react'
import { Link, Outlet } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { AuthDialog } from '@/auth/AuthDialog'
import { Button } from '@/components/base/buttons/button'
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from '@/components/base/dropdown/dropdown'
import { PlayerDock } from '@/player/PlayerDock'

function AccountControls () {
  const { status, openDialog, logOut } = useAuth()

  if (status === 'checking') return <div className="h-9" />
  if (status === 'guest') {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => openDialog('log-in')}>Log in</Button>
        <Button onClick={() => openDialog('sign-up')}>Create account</Button>
      </div>
    )
  }
  return (
    <Dropdown>
      <DropdownTrigger aria-label="Account" className="grid size-9 place-items-center rounded-full bg-background-secondary-default text-text-primary">
        <RiUser3Line className="size-5" aria-hidden />
      </DropdownTrigger>
      <DropdownPopover aria-label="Account menu" placement="bottom end">
        <DropdownItem onSelect={logOut}>Log out</DropdownItem>
      </DropdownPopover>
    </Dropdown>
  )
}

export function AppLayout () {
  return (
    <div className="min-h-dvh pb-36">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-baseline font-display text-[26px] font-extrabold leading-none tracking-tight text-ink">
          My<span className="relative">Pod<span aria-hidden className="absolute -right-2 -top-0.5 bottom-0.5 w-[3px] rounded-full bg-signal" /></span>
        </Link>
        <AccountControls />
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 sm:px-6">
        <Outlet />
      </main>
      <PlayerDock />
      <AuthDialog />
    </div>
  )
}
