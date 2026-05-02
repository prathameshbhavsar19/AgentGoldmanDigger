import { type InputHTMLAttributes, forwardRef, type ReactNode } from 'react'
import { clsx } from 'clsx'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  trailing?: ReactNode
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, hint, trailing, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
          {props.required && <span className="text-danger ml-1" aria-hidden>*</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              'w-full rounded border bg-bg-elev px-3 py-2 text-sm text-ink placeholder:text-ink-faint',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand',
              error ? 'border-danger' : 'border-[var(--border)]',
              trailing && 'pr-10',
              className
            )}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            aria-invalid={!!error}
            {...props}
          />
          {trailing && (
            <div className="absolute inset-y-0 right-3 flex items-center">{trailing}</div>
          )}
        </div>
        {error && <p id={`${inputId}-error`} role="alert" className="text-xs text-danger">{error}</p>}
        {hint && !error && <p id={`${inputId}-hint`} className="text-xs text-ink-muted">{hint}</p>}
      </div>
    )
  }
)
Field.displayName = 'Field'
export default Field
