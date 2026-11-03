import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { IconButton } from '@/components/base/buttons/icon-button'

// A titled row that scrolls sideways, with arrow buttons when it overflows.
export function Shelf ({ title, children }: { title: string, children: ReactNode }) {
  const scrollerRef = useRef<HTMLUListElement>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  const updateArrows = useCallback(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    setCanGoBack(scroller.scrollLeft > 0)
    setCanGoForward(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateArrows()
    window.addEventListener('resize', updateArrows)
    return () => window.removeEventListener('resize', updateArrows)
  }, [updateArrows, children])

  const scrollBy = (direction: number) => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' })
  }

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-display text-[28px] font-bold leading-tight tracking-tight">{title}</h2>
        {(canGoBack || canGoForward) && (
          <div className="flex gap-1">
            <IconButton icon={RiArrowLeftSLine} aria-label={`Scroll ${title} back`} disabled={!canGoBack} onClick={() => scrollBy(-1)} />
            <IconButton icon={RiArrowRightSLine} aria-label={`Scroll ${title} forward`} disabled={!canGoForward} onClick={() => scrollBy(1)} />
          </div>
        )}
      </div>
      <ul ref={scrollerRef} onScroll={updateArrows} className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
        {children}
      </ul>
    </section>
  )
}
