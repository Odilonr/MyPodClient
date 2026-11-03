import { RiAddCircleLine, RiCompass3Line, RiHeart3Line, RiHome5Line, RiPlayListLine, RiUser3Line } from '@remixicon/react'
import { Link, NavLink, Outlet } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import { AuthDialog } from '@/auth/AuthDialog'
import { Button } from '@/components/base/buttons/button'
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from '@/components/base/dropdown/dropdown'
import { useLibrary } from '@/library/LibraryContext'
import { NewPlaylistDialog } from '@/library/NewPlaylistDialog'
import { PlayerDock } from '@/player/PlayerDock'
import { cx } from '@/utils/cx'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: RiHome5Line },
  { to: '/browse', label: 'Browse', icon: RiCompass3Line },
  { to: '/favorites', label: 'Favorites', icon: RiHeart3Line },
  { to: '/playlists', label: 'Playlists', icon: RiPlayListLine },
  { to: '/add', label: 'Add a podcast', icon: RiAddCircleLine }
]

function Wordmark ({ className }: { className?: string }) {
  return (
    <Link to="/" className={cx('flex items-baseline font-display text-[26px] font-extrabold leading-none tracking-tight', className)}>
      My<span className="relative">Pod<span aria-hidden className="absolute -right-2 -top-0.5 bottom-0.5 w-[3px] rounded-full bg-signal" /></span>
    </Link>
  )
}

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

function Sidebar () {
  const { playlists } = useLibrary()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col bg-ink pb-32 text-dock-text lg:flex">
      <Wordmark className="px-5 pb-6 pt-5 text-white" />
      <nav aria-label="Main">
        <ul>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) => cx(
                  'relative flex items-center gap-3 px-5 py-2.5 text-headline-medium outline-none hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-butter',
                  isActive && 'text-white before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r-full before:bg-signal'
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {playlists.length > 0 && (
        <nav aria-label="Your playlists" className="mt-6 min-h-0 flex-1 overflow-y-auto border-t border-dock-line pt-4">
          <p className="px-5 pb-1 text-caption-1-medium">Your playlists</p>
          <ul>
            {playlists.map((playlist) => (
              <li key={playlist.id}>
                <NavLink
                  to={`/playlists/${playlist.id}`}
                  className={({ isActive }) => cx('block truncate px-5 py-1.5 text-body-regular outline-none hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-butter', isActive && 'text-white')}
                >
                  {playlist.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </aside>
  )
}

export function AppLayout () {
  const { notice } = useLibrary()

  return (
    <div className="min-h-dvh pb-40 lg:pl-56">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Sidebar />
      <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:justify-end lg:px-10">
        <Wordmark className="text-ink lg:hidden" />
        <AccountControls />
      </header>
      <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6 lg:hidden">
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cx('shrink-0 rounded-full px-3 py-1.5 text-body-medium', isActive ? 'bg-ink text-white' : 'text-text-secondary')}
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main id="main" className="mx-auto max-w-[1680px] px-4 sm:px-6 lg:px-10">
        <Outlet />
      </main>
      {notice && (
        <p role="status" className="fixed bottom-36 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-body-medium text-white lg:ml-28">
          {notice}
        </p>
      )}
      <PlayerDock />
      <AuthDialog />
      <NewPlaylistDialog />
    </div>
  )
}
