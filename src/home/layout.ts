export type SectionType = 'recent' | 'start_here' | 'latest' | 'shows' | 'favorites' | 'playlists' | 'topics'
export type SectionSize = 'small' | 'large'

export interface LayoutSection {
  type: SectionType
  visible: boolean
  size: SectionSize
  hiddenItems: string[]
}

interface SectionInfo {
  title: string
  canResize: boolean
  // Shown in edit mode when the section has nothing in it yet.
  emptyHint: string
}

// To add a section type, add it here, in the API's list, and in HomeSection.
export const SECTION_INFO: Record<SectionType, SectionInfo> = {
  recent: { title: 'Recently listened', canResize: true, emptyHint: 'Episodes you play will appear here.' },
  start_here: { title: 'Start here', canResize: true, emptyHint: 'The newest episode from each show appears here.' },
  latest: { title: 'Latest episodes', canResize: true, emptyHint: 'New episodes appear here.' },
  shows: { title: 'Shows', canResize: true, emptyHint: 'Shows appear here.' },
  favorites: { title: 'My favorites', canResize: true, emptyHint: 'Press the heart on any episode to keep it here.' },
  playlists: { title: 'My playlists', canResize: true, emptyHint: 'Your playlists appear here.' },
  topics: { title: 'Browse by topic', canResize: false, emptyHint: 'Topics appear here.' }
}

const DEFAULT_ORDER: SectionType[] = ['recent', 'start_here', 'latest', 'shows', 'favorites', 'playlists', 'topics']

export const defaultLayout = (): LayoutSection[] =>
  DEFAULT_ORDER.map((type) => ({ type, visible: true, size: 'large', hiddenItems: [] }))

export function moveSectionTo (sections: LayoutSection[], type: SectionType, toIndex: number) {
  const fromIndex = sections.findIndex((section) => section.type === type)
  if (fromIndex === -1 || toIndex < 0 || toIndex >= sections.length) return sections
  const next = [...sections]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

export function moveSection (sections: LayoutSection[], type: SectionType, direction: -1 | 1) {
  return moveSectionTo(sections, type, sections.findIndex((section) => section.type === type) + direction)
}

function updateSection (sections: LayoutSection[], type: SectionType, change: Partial<LayoutSection>) {
  return sections.map((section) => (section.type === type ? { ...section, ...change } : section))
}

export const setSectionVisible = (sections: LayoutSection[], type: SectionType, visible: boolean) =>
  updateSection(sections, type, { visible })

export const setSectionSize = (sections: LayoutSection[], type: SectionType, size: SectionSize) =>
  updateSection(sections, type, { size })

export function setItemVisible (sections: LayoutSection[], type: SectionType, item: string, visible: boolean) {
  const section = sections.find((candidate) => candidate.type === type)
  if (!section) return sections
  const others = section.hiddenItems.filter((hidden) => hidden !== item)
  return updateSection(sections, type, { hiddenItems: visible ? others : [...others, item] })
}
