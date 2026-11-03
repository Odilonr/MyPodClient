import { RiArrowDownLine, RiArrowUpLine, RiDraggable } from '@remixicon/react'
import { useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/base/buttons/button'
import { IconButton } from '@/components/base/buttons/icon-button'
import { SegmentedControl, SegmentedControlItem } from '@/components/base/segmented-control/segmented-control'
import { Switch } from '@/components/base/switch/switch'
import { cx } from '@/utils/cx'
import { SECTION_INFO, type LayoutSection, type SectionSize, type SectionType } from './layout'

interface EditableSectionProps {
  section: LayoutSection
  index: number
  total: number
  canChooseItems: boolean
  onMove: (type: SectionType, direction: -1 | 1) => void
  onDropOn: (type: SectionType) => void
  onDragStart: (type: SectionType) => void
  onVisibleChange: (type: SectionType, visible: boolean) => void
  onSizeChange: (type: SectionType, size: SectionSize) => void
  onChooseItems: (type: SectionType) => void
  children: ReactNode
}

// The frame around a section in edit mode. Its content is inert, so a press
// on a play button or link does nothing while the user is arranging the page.
export function EditableSection ({
  section, index, total, canChooseItems, onMove, onDropOn, onDragStart, onVisibleChange, onSizeChange, onChooseItems, children
}: EditableSectionProps) {
  const { type, visible, size } = section
  const { title, canResize } = SECTION_INFO[type]
  const frameRef = useRef<HTMLDivElement>(null)
  const [isDropTarget, setIsDropTarget] = useState(false)

  return (
    <div
      ref={frameRef}
      data-testid={`edit-section-${type}`}
      style={{ viewTransitionName: `section-${type}` }}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDropTarget(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDropTarget(false)
      }}
      onDrop={(event) => {
        event.preventDefault()
        setIsDropTarget(false)
        onDropOn(type)
      }}
      className={cx(
        'mt-5 rounded-md border-2 border-dashed bg-background-primary-default',
        isDropTarget ? 'border-signal' : 'border-separator-border-strong'
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-t-sm bg-background-secondary-default px-3 py-2">
        <div className="flex min-w-0 flex-1 basis-48 items-center gap-1">
          <span
            draggable
            title="Drag to move this section"
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', type)
              if (frameRef.current) event.dataTransfer.setDragImage(frameRef.current, 24, 24)
              onDragStart(type)
            }}
            className="grid size-8 shrink-0 cursor-grab place-items-center rounded text-text-secondary active:cursor-grabbing"
          >
            <RiDraggable className="size-5" aria-hidden />
          </span>
          <IconButton
            id={`move-up-${type}`}
            icon={RiArrowUpLine}
            size="small"
            aria-label={`Move ${title} up`}
            disabled={index === 0}
            onClick={() => onMove(type, -1)}
          />
          <IconButton
            id={`move-down-${type}`}
            icon={RiArrowDownLine}
            size="small"
            aria-label={`Move ${title} down`}
            disabled={index === total - 1}
            onClick={() => onMove(type, 1)}
          />
          <p className="ml-1 truncate text-headline-medium">{title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canChooseItems && (
            <Button variant="secondary" size="small" onClick={() => onChooseItems(type)}>Add or remove</Button>
          )}
          {canResize && (
            <SegmentedControl
              aria-label={`Size of ${title}`}
              selectedKeys={[size]}
              onSelectionChange={(keys) => {
                const [next] = [...keys]
                if (next) onSizeChange(type, next as SectionSize)
              }}
            >
              <SegmentedControlItem id="small">Small</SegmentedControlItem>
              <SegmentedControlItem id="large">Large</SegmentedControlItem>
            </SegmentedControl>
          )}
          <Switch isSelected={visible} onChange={(next) => onVisibleChange(type, next)} aria-label={`Show ${title}`}>
            <span className="text-body-medium">{visible ? 'Shown' : 'Hidden'}</span>
          </Switch>
        </div>
      </div>
      {/* The frame already shows the title, so hide the section's own title row. */}
      <div inert className={cx('px-3 pb-4 [&>section]:mt-3 [&>section>div:first-child]:hidden', !visible && 'opacity-40')}>
        {children}
      </div>
    </div>
  )
}
