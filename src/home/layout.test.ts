import { describe, expect, it } from 'vitest'
import { defaultLayout, moveSection, moveSectionTo, setItemVisible, setSectionSize, setSectionVisible } from './layout'

const order = (sections: ReturnType<typeof defaultLayout>) => sections.map((section) => section.type)

describe('layout changes', () => {
  it('moves a section up and down', () => {
    const start = defaultLayout()
    expect(order(moveSection(start, 'latest', -1)).slice(0, 3)).toEqual(['recent', 'latest', 'start_here'])
    expect(order(moveSection(start, 'latest', 1)).slice(2, 4)).toEqual(['shows', 'latest'])
  })

  it('does not move past the first or last place', () => {
    const start = defaultLayout()
    expect(moveSection(start, 'recent', -1)).toBe(start)
    expect(moveSection(start, 'topics', 1)).toBe(start)
  })

  it('moves a section to a dropped position', () => {
    const moved = moveSectionTo(defaultLayout(), 'topics', 0)
    expect(order(moved)[0]).toBe('topics')
    expect(moved).toHaveLength(defaultLayout().length)
  })

  it('does not change the original list', () => {
    const start = defaultLayout()
    const before = order(start)
    moveSection(start, 'latest', 1)
    setSectionVisible(start, 'latest', false)
    expect(order(start)).toEqual(before)
    expect(start.every((section) => section.visible)).toBe(true)
  })

  it('hides a section and changes its size', () => {
    const hidden = setSectionVisible(defaultLayout(), 'shows', false)
    expect(hidden.find((section) => section.type === 'shows')?.visible).toBe(false)
    const small = setSectionSize(defaultLayout(), 'shows', 'small')
    expect(small.find((section) => section.type === 'shows')?.size).toBe('small')
  })

  it('hides an item and brings it back without repeating it', () => {
    let sections = setItemVisible(defaultLayout(), 'shows', 'show-1', false)
    sections = setItemVisible(sections, 'shows', 'show-1', false)
    expect(sections.find((section) => section.type === 'shows')?.hiddenItems).toEqual(['show-1'])
    sections = setItemVisible(sections, 'shows', 'show-1', true)
    expect(sections.find((section) => section.type === 'shows')?.hiddenItems).toEqual([])
  })
})
