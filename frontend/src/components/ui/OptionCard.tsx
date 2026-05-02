import { type HTMLAttributes } from 'react'
import { clsx } from 'clsx'
import { Check } from 'lucide-react'

interface OptionCardProps extends HTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  label: string
  description?: string
  disabled?: boolean
  value: string
}

export function OptionCard({ selected, label, description, disabled, onClick, value }: OptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'w-full text-left px-5 py-4 rounded-lg border-2 transition-all duration-150 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
        selected
          ? 'border-brand bg-brand/5 text-brand'
          : 'border-[var(--border)] bg-bg-elev text-ink hover:border-brand/40 hover:bg-[var(--bg-subtle)]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      data-value={value}
    >
      <div className="flex items-start gap-3">
        <div className={clsx(
          'mt-0.5 flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center',
          selected ? 'border-brand bg-brand' : 'border-[var(--border-strong)]'
        )}>
          {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>
        <div>
          <div className="font-medium text-sm">{label}</div>
          {description && <div className="mt-0.5 text-xs text-ink-muted">{description}</div>}
        </div>
      </div>
    </button>
  )
}
export default OptionCard
