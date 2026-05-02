import * as Toast from '@radix-ui/react-toast'
import { useState, createContext, useContext, useCallback, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ToastItem { id: string; title: string; description?: string; variant?: 'default' | 'success' | 'danger' }
interface ToastContextType { toast: (item: Omit<ToastItem, 'id'>) => void }

const ToastContext = createContext<ToastContextType>({ toast: () => {} })
export const useToast = () => useContext(ToastContext)

export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toast = useCallback((item: Omit<ToastItem, 'id'>) => {
    setToasts(p => [...p, { ...item, id: crypto.randomUUID() }])
  }, [])
  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right">
        {children}
        {toasts.map(t => (
          <Toast.Root
            key={t.id}
            className="bg-bg-elev shadow-floating rounded-lg border border-[var(--border)] p-4 flex gap-3 items-start data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-in"
            onOpenChange={(open) => { if (!open) setToasts(p => p.filter(x => x.id !== t.id)) }}
            open
          >
            <div className="flex-1">
              <Toast.Title className="text-sm font-medium text-ink">{t.title}</Toast.Title>
              {t.description && <Toast.Description className="text-xs text-ink-muted mt-0.5">{t.description}</Toast.Description>}
            </div>
            <Toast.Close asChild>
              <button className="text-ink-faint hover:text-ink transition-colors cursor-pointer" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-80 z-50" />
      </Toast.Provider>
    </ToastContext.Provider>
  )
}
