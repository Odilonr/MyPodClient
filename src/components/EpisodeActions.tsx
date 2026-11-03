import { RiAddLine, RiHeart3Fill, RiHeart3Line } from '@remixicon/react'
import type { Episode } from '@/api/types'
import { Dropdown, DropdownDivider, DropdownItem, DropdownPopover, DropdownTrigger } from '@/components/base/dropdown/dropdown'
import { useLibrary } from '@/library/LibraryContext'
import { cx } from '@/utils/cx'

const actionButton = 'grid size-9 shrink-0 place-items-center rounded-full outline-none transition-colors hover:bg-ink/10 focus-visible:ring-2 focus-visible:ring-border-focus-ring motion-reduce:transition-none'

export function EpisodeActions ({ episode, className }: { episode: Episode, className?: string }) {
  const { isFavorite, toggleFavorite, playlists, openNewPlaylist, addToPlaylist } = useLibrary()
  const favorite = isFavorite(episode.id)

  return (
    <div className={cx('flex shrink-0 items-center', className)}>
      <button
        type="button"
        aria-label={`${favorite ? 'Remove' : 'Add'} ${episode.title} ${favorite ? 'from' : 'to'} favorites`}
        aria-pressed={favorite}
        onClick={() => toggleFavorite(episode)}
        className={actionButton}
      >
        {favorite ? <RiHeart3Fill className="size-5 text-signal" aria-hidden /> : <RiHeart3Line className="size-5" aria-hidden />}
      </button>
      {playlists.length === 0 ? (
        <button type="button" aria-label={`Add ${episode.title} to a playlist`} onClick={() => openNewPlaylist(episode)} className={actionButton}>
          <RiAddLine className="size-5" aria-hidden />
        </button>
      ) : (
        <Dropdown>
          <DropdownTrigger aria-label={`Add ${episode.title} to a playlist`} className={actionButton}>
            <RiAddLine className="size-5" aria-hidden />
          </DropdownTrigger>
          <DropdownPopover aria-label="Add to playlist" placement="bottom end">
            {playlists.map((playlist) => (
              <DropdownItem key={playlist.id} onSelect={() => addToPlaylist(playlist, episode)}>{playlist.name}</DropdownItem>
            ))}
            <DropdownDivider />
            <DropdownItem onSelect={() => openNewPlaylist(episode)}>New playlist</DropdownItem>
          </DropdownPopover>
        </Dropdown>
      )}
    </div>
  )
}
