/**
 * NextStepActions — numbered action plan with emoji + time estimate.
 * v2: steps array with num/emoji/action/time
 * v1: plain actions array fallback
 * legacy: primary/secondary button format
 */
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'

interface Step {
  num?: number
  emoji?: string
  action: string
  why?: string
  time?: string
}

interface NextAction {
  label: string
  variant?: 'primary' | 'secondary'
}

interface NextStepActionsProps {
  // v2 visual
  headline?: string
  steps?: Step[]
  // v1 plain actions list
  actions?: string[]
  // legacy structured
  primary?: NextAction
  secondary?: NextAction[]
  onCompare?: () => void
  onDownload?: () => void
  onFollowUp?: () => void
}

export function NextStepActions({ headline, steps, actions, primary, secondary = [], onCompare }: NextStepActionsProps) {

  // v2: steps with emoji + time
  if (steps && steps.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        data-testid="next-steps-module"
      >
        <h3 className="font-bold text-ink text-base mb-4">
          🚀 {headline ?? 'Your action plan — start here'}
        </h3>

        <div className="flex flex-col gap-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4"
            >
              {/* Step number circle */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-sm">
                {step.num ?? i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  {step.emoji && <span className="text-xl flex-shrink-0 leading-none mt-0.5">{step.emoji}</span>}
                  <p className="text-sm font-semibold text-ink leading-snug">{step.action}</p>
                </div>
                {step.why && (
                  <p className="text-xs text-ink-muted leading-relaxed mb-1.5 ml-7">{step.why}</p>
                )}
                {step.time && (
                  <div className="flex items-center gap-1 ml-7">
                    <Clock className="h-3 w-3 text-ink-faint" />
                    <span className="text-[11px] text-ink-faint">{step.time}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  // v1 plain actions array
  if (actions && actions.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        data-testid="next-steps-module"
      >
        <h3 className="font-bold text-ink text-base mb-4">🚀 Your action plan</h3>
        <div className="flex flex-col gap-3">
          {actions.map((action, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xs">
                {i + 1}
              </div>
              <p className="text-sm text-ink leading-relaxed">{action}</p>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  // Legacy primary/secondary button format
  if (!primary && !secondary.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      data-testid="next-steps-module"
      className="flex flex-wrap gap-3"
    >
      {primary && (
        <button
          onClick={(primary.variant as string) === 'compare' ? onCompare : undefined}
          className="px-4 py-2.5 rounded-xl bg-[#003366] text-white text-sm font-semibold hover:bg-[#004488] transition-colors cursor-pointer"
        >
          {primary.label}
        </button>
      )}
      {secondary.map((s, i) => (
        <button
          key={i}
          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-ink text-sm font-medium hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
        >
          {s.label}
        </button>
      ))}
    </motion.div>
  )
}

export default NextStepActions
