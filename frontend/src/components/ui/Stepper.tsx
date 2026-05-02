import { clsx } from 'clsx'
import { Check } from 'lucide-react'

interface StepperProps {
  steps: string[]
  currentIndex: number
}

export function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center">
        {steps.map((label, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          return (
            <li key={label} className={clsx('flex items-center', i < steps.length - 1 && 'flex-1')}>
              <div className="flex flex-col items-center gap-1">
                <div
                  aria-current={active ? 'step' : undefined}
                  className={clsx(
                    'h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-colors',
                    done  && 'border-brand bg-brand text-white',
                    active && 'border-accent bg-[var(--accent-soft)] text-[var(--accent-strong)]',
                    !done && !active && 'border-[var(--border)] text-ink-faint'
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </div>
                <span className={clsx('hidden md:block text-xs', active ? 'text-ink font-medium' : 'text-ink-faint')}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={clsx('flex-1 h-0.5 mx-1 rounded', i < currentIndex ? 'bg-brand' : 'bg-[var(--border)]')} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
export default Stepper
