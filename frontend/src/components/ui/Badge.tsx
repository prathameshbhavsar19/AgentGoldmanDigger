import { clsx } from 'clsx'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warn' | 'danger' | 'accent' | 'brand'

interface BadgeProps { children: ReactNode; variant?: BadgeVariant; className?: string }

const variants: Record<BadgeVariant, string> = {
  default:  'bg-[var(--bg-subtle)] text-ink-muted border border-[var(--border)]',
  success:  'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success)]/20',
  warn:     'bg-[var(--warn-soft)] text-[var(--warn)] border border-[var(--warn)]/20',
  danger:   'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20',
  accent:   'bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent)]/20',
  brand:    'bg-brand/10 text-brand border border-brand/20',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
export default Badge
