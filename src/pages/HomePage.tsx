import { RiEqualizer2Line } from '@remixicon/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { getLatestEpisodes, getLayout, getShows, saveLayout } from '@/api/client'
import type { Episode, Show } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/base/buttons/button'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/base/modal/modal'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { LoadError } from '@/components/LoadError'
import { ChooseItemsDialog, type ChoosableItem } from '@/home/ChooseItemsDialog'
import { EditableSection } from '@/home/EditableSection'
import { HomeSection, type HomeData } from '@/home/HomeSection'
import {
  defaultLayout, moveSection, moveSectionTo, setItemVisible, setSectionSize, setSectionVisible,
  SECTION_INFO, type LayoutSection, type SectionType
} from '@/home/layout'
import { useLibrary } from '@/library/LibraryContext'
import { usePlayer } from '@/player/PlayerContext'
import { isSample } from '@/utils/format'

const LATEST_COUNT = 24
const LOGIN_ONLY_SECTIONS: SectionType[] = ['recent', 'favorites', 'playlists']

function newestPerShow (episodes: Episode[]) {
  const seen = new Set<string>()
  return episodes.filter((episode) => {
    if (seen.has(episode.show_id)) return false
    seen.add(episode.show_id)
    return true
  })
}

// Lets the browser slide sections to their new places, when it can.
function animateChange (change: () => void) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduceMotion) {
    change()
    return
  }
  document.startViewTransition(() => flushSync(change))
}

export function HomePage () {
  const { status, openDialog } = useAuth()
  const { recent, favorites, playlists, refreshRecent, showNotice } = useLibrary()
  const { episode: currentEpisode, isPlaying } = usePlayer()
  const signedIn = status === 'signed-in'

  const [shows, setShows] = useState<Show[] | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [failed, setFailed] = useState(false)

  const [savedLayout, setSavedLayout] = useState<LayoutSection[] | null>(null)
  // The layout being edited. Edit mode is on while this is set, and nothing
  // reaches the server until Save.
  const [draft, setDraft] = useState<LayoutSection[] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [choosingFor, setChoosingFor] = useState<SectionType | null>(null)
  const [confirmingReset, setConfirmingReset] = useState(false)
  const draggedType = useRef<SectionType | null>(null)

  const load = useCallback(() => {
    setFailed(false)
    Promise.all([getShows(), getLatestEpisodes(LATEST_COUNT)])
      .then(([nextShows, nextEpisodes]) => {
        setShows(nextShows)
        setEpisodes(nextEpisodes)
      })
      .catch(() => setFailed(true))
  }, [])

  useEffect(load, [load])

  useEffect(() => {
    if (status === 'checking') return
    setDraft(null)
    if (!signedIn) {
      setSavedLayout(defaultLayout())
      return
    }
    setSavedLayout(null)
    getLayout()
      .then(({ sections }) => setSavedLayout(sections))
      .catch(() => {
        setSavedLayout(defaultLayout())
        showNotice('Your saved layout could not be loaded, so this is the starting layout.')
      })
  }, [showNotice, signedIn, status])

  // A new listen changes this list, so reload it when playback starts or stops.
  useEffect(() => {
    refreshRecent().catch(() => {})
  }, [currentEpisode?.id, isPlaying, refreshRecent])

  const featured = useMemo(() => newestPerShow(episodes), [episodes])
  const topics = useMemo(() => [...new Set((shows ?? []).map((show) => show.show_type))].sort(), [shows])
  const data: HomeData = { shows: shows ?? [], episodes, featured, topics, recent, favorites, playlists }

  const isEditing = draft !== null
  const sections = draft ?? savedLayout
  const allSample = shows !== null && shows.length > 0 && shows.every((show) => isSample(show.name))

  const choosableItems = useCallback((type: SectionType): ChoosableItem[] => {
    switch (type) {
      case 'start_here':
      case 'shows':
        return (shows ?? []).map((show) => ({ id: show.id, label: show.name }))
      case 'playlists':
        return playlists.map((playlist) => ({ id: playlist.id, label: playlist.name }))
      case 'topics':
        return topics.map((topic) => ({ id: topic, label: topic }))
      default:
        return []
    }
  }, [playlists, shows, topics])

  function handleMove (type: SectionType, direction: -1 | 1) {
    if (!draft) return
    const next = moveSection(draft, type, direction)
    const index = next.findIndex((section) => section.type === type)
    animateChange(() => setDraft(next))
    setAnnouncement(`${SECTION_INFO[type].title} moved to place ${index + 1} of ${next.length}`)
    // A button at the end of the list becomes disabled, so keep focus on its partner.
    if (index === 0) document.getElementById(`move-down-${type}`)?.focus()
    if (index === next.length - 1) document.getElementById(`move-up-${type}`)?.focus()
  }

  function handleDrop (target: SectionType) {
    const dragged = draggedType.current
    draggedType.current = null
    if (!draft || !dragged || dragged === target) return
    const toIndex = draft.findIndex((section) => section.type === target)
    animateChange(() => setDraft(moveSectionTo(draft, dragged, toIndex)))
    setAnnouncement(`${SECTION_INFO[dragged].title} moved to place ${toIndex + 1} of ${draft.length}`)
  }

  function startEditing () {
    if (!signedIn) {
      openDialog('log-in')
      return
    }
    setSaveError(null)
    setDraft(savedLayout)
  }

  async function handleSave () {
    if (!draft) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const { sections: saved } = await saveLayout(draft)
      setSavedLayout(saved)
      setDraft(null)
      showNotice('Your home is saved')
    } catch {
      setSaveError('Your home could not be saved. Your changes are still here, so try again.')
    } finally {
      setIsSaving(false)
    }
  }

  function handleReset () {
    setConfirmingReset(false)
    animateChange(() => setDraft(defaultLayout()))
    setAnnouncement('Starting layout restored. Press Save to keep it.')
  }

  const choosingSection = draft?.find((section) => section.type === choosingFor)

  return (
    <>
      {isEditing && (
        <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-md bg-ink px-4 py-3 text-white">
          <div>
            <p className="font-display text-[20px] font-bold leading-tight">Customizing your home</p>
            <p className="text-body-regular text-dock-text">Nothing changes until you press Save.</p>
            {saveError && <p role="alert" className="mt-1 text-body-medium text-butter">{saveError}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="h-9 rounded-2lg px-3 text-body-medium text-white outline-none hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-butter"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="h-9 rounded-2lg bg-butter px-4 text-body-medium text-ink outline-none hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-butter disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
      )}
      <p role="status" className="sr-only">{announcement}</p>

      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <h1 className="max-w-4xl pb-2 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[0.98] tracking-tight">
          What do you want to hear?
        </h1>
        {!isEditing && status !== 'checking' && (
          <Button variant="secondary" leadingIcon={RiEqualizer2Line} className="mb-3" onClick={startEditing}>Customize home</Button>
        )}
      </div>
      {allSample && (
        <p className="max-w-[65ch] text-body-regular text-text-secondary">
          These shows are sample data made for this demo. They are not real podcasts, and the audio is a generated tone.
        </p>
      )}

      {failed ? (
        <LoadError message="The shows could not be loaded. Check that the API is running." onRetry={load} />
      ) : shows === null || sections === null ? (
        <div aria-label="Loading your home" className="mt-10 flex gap-4 overflow-hidden">
          {[0, 1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-72 w-72 shrink-0" />)}
        </div>
      ) : shows.length === 0 ? (
        <p className="py-8 text-body-regular text-text-secondary">There are no shows yet. Add sample shows with npm run seed in the API folder.</p>
      ) : isEditing ? (
        <>
          {sections.map((section, index) => (
            <EditableSection
              key={section.type}
              section={section}
              index={index}
              total={sections.length}
              canChooseItems={choosableItems(section.type).length > 0}
              onMove={handleMove}
              onDragStart={(type) => { draggedType.current = type }}
              onDropOn={handleDrop}
              onVisibleChange={(type, visible) => setDraft((current) => current && setSectionVisible(current, type, visible))}
              onSizeChange={(type, size) => setDraft((current) => current && setSectionSize(current, type, size))}
              onChooseItems={setChoosingFor}
            >
              <HomeSection section={section} data={data} isEditing />
            </EditableSection>
          ))}
          <div className="mt-6">
            <Button variant="danger" onClick={() => setConfirmingReset(true)}>Reset to starting layout</Button>
          </div>
        </>
      ) : (
        <>
          {sections
            .filter((section) => section.visible && (signedIn || !LOGIN_ONLY_SECTIONS.includes(section.type)))
            .map((section) => <HomeSection key={section.type} section={section} data={data} isEditing={false} />)}
          {!signedIn && (
            <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-md bg-background-secondary-default p-5">
              <div>
                <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight">Keep what you like</h2>
                <p className="mt-1 max-w-[60ch] text-body-regular text-text-secondary">
                  Create an account to save favorites, build playlists, arrange your home, and pick up where you stopped.
                </p>
              </div>
              <Button onClick={() => openDialog('sign-up')}>Create account</Button>
            </section>
          )}
        </>
      )}

      <ChooseItemsDialog
        title={choosingFor ? SECTION_INFO[choosingFor].title : null}
        items={choosingFor ? choosableItems(choosingFor) : []}
        hiddenItems={choosingSection?.hiddenItems ?? []}
        onChange={(item, visible) => {
          if (choosingFor) setDraft((current) => current && setItemVisible(current, choosingFor, item, visible))
        }}
        onClose={() => setChoosingFor(null)}
      />
      <Modal size="sm" isOpen={confirmingReset} onOpenChange={setConfirmingReset}>
        <ModalHeader title="Go back to the starting layout?" />
        <ModalBody>
          <p className="text-body-regular text-text-secondary">This puts every section back in its first place and shows everything again. Press Save afterward to keep it, or Cancel to undo it.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setConfirmingReset(false)}>Keep my layout</Button>
          <Button variant="danger" onClick={handleReset}>Reset</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
