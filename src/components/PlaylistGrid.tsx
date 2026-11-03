import { RiAddLine } from '@remixicon/react'
import { Link } from 'react-router'
import type { Playlist } from '@/api/types'
import { useLibrary } from '@/library/LibraryContext'
import { Cover } from './Cover'

export function PlaylistGrid ({ playlists }: { playlists: Playlist[] }) {
  const { openNewPlaylist } = useLibrary()

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
      {playlists.map((playlist) => (
        <li key={playlist.id}>
          <Link to={`/playlists/${playlist.id}`} className="group block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2">
            <Cover seed={playlist.id} className="w-full rounded-sm" />
            <p className="mt-2 truncate font-display text-[19px] font-semibold leading-tight group-hover:underline">{playlist.name}</p>
            <p className="mt-0.5 text-body-regular text-text-secondary">
              {playlist.episode_count ?? 0} {playlist.episode_count === 1 ? 'episode' : 'episodes'}
            </p>
          </Link>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() => openNewPlaylist()}
          className="grid aspect-square w-full place-items-center rounded-sm border-2 border-dashed border-separator-border-strong text-text-secondary outline-none hover:border-cobalt hover:text-cobalt focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          <span className="flex flex-col items-center gap-1 text-body-medium">
            <RiAddLine className="size-7" aria-hidden />
            New playlist
          </span>
        </button>
      </li>
    </ul>
  )
}
