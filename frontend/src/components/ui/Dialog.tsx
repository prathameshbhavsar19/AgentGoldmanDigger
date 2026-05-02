import * as RadixDialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

export function Dialog({ open, onOpenChange, title, description, children, size = 'md' }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 animate-fade-in" />
        <RadixDialog.Content
          className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full ${sizes[size]} bg-bg-elev rounded-xl shadow-floating p-6 animate-slide-up`}
          aria-describedby={description ? 'dialog-desc' : undefined}
        >
          <div className="flex items-center justify-between mb-4">
            <RadixDialog.Title className="text-lg font-semibold text-ink">{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button className="text-ink-faint hover:text-ink transition-colors cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-brand" aria-label="Close dialog">
                <X className="h-5 w-5" />
              </button>
            </RadixDialog.Close>
          </div>
          {description && <RadixDialog.Description id="dialog-desc" className="text-sm text-ink-muted mb-4">{description}</RadixDialog.Description>}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
export default Dialog
