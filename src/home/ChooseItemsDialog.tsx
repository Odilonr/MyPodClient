import { Button } from '@/components/base/buttons/button'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/base/modal/modal'
import { Switch } from '@/components/base/switch/switch'
import { withoutSampleLabel } from '@/utils/format'

export interface ChoosableItem {
  id: string
  label: string
}

interface ChooseItemsDialogProps {
  title: string | null
  items: ChoosableItem[]
  hiddenItems: string[]
  onChange: (item: string, visible: boolean) => void
  onClose: () => void
}

export function ChooseItemsDialog ({ title, items, hiddenItems, onChange, onClose }: ChooseItemsDialogProps) {
  return (
    <Modal size="sm" isOpen={title !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <ModalHeader title={title ?? ''} description="Choose what appears in this section." />
      <ModalBody>
        <ul className="flex flex-col pb-1">
          {items.map((item) => (
            <li key={item.id} className="border-b border-separator-border py-2 last:border-b-0">
              <Switch
                className="flex w-full flex-row-reverse justify-between"
                isSelected={!hiddenItems.includes(item.id)}
                onChange={(visible) => onChange(item.id, visible)}
              >
                <span className="truncate text-body-medium">{withoutSampleLabel(item.label)}</span>
              </Switch>
            </li>
          ))}
        </ul>
      </ModalBody>
      <ModalFooter>
        <Button className="w-full justify-center" onClick={onClose}>Done</Button>
      </ModalFooter>
    </Modal>
  )
}
