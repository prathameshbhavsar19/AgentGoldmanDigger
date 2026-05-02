import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertCircle } from 'lucide-react'
import type { ActivityStep } from '../../stores/canvasStore'

interface ActivityStepRowProps {
  step: ActivityStep
}

export function ActivityStepRow({ step }: ActivityStepRowProps) {
  const { status, label, currentThought, summary } = step
  const thoughtRef = useRef<HTMLSpanElement>(null)

  // Auto-scroll to active thought
  useEffect(() => {
    if (status === 'active') thoughtRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentThought, status])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex gap-3 items-start py-2"
    >
      {/* Dot indicator */}
      <div className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {status === 'completed' && (
          <div className="h-5 w-5 rounded-full bg-brand flex items-center justify-center">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        )}
        {status === 'active' && (
          <div className="h-3 w-3 rounded-full bg-accent animate-pulse-gold" />
        )}
        {status === 'error' && (
          <AlertCircle className="h-5 w-5 text-danger" />
        )}
        {(status === 'pending' || status === 'input-needed') && (
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--dot-pending)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Step label */}
        <p className={`text-sm font-medium leading-snug ${
          status === 'completed' ? 'text-ink' :
          status === 'active' ? 'text-ink font-semibold' :
          'text-ink-faint'
        }`}>
          {label}
        </p>

        {/* Active: streaming thought */}
        <AnimatePresence mode="wait">
          {status === 'active' && currentThought && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-1 text-xs text-ink-muted leading-relaxed italic"
            >
              <span ref={thoughtRef}>{currentThought}</span>
              <span className="inline-block w-0.5 h-3 bg-accent animate-pulse ml-0.5 align-middle" aria-hidden />
            </motion.p>
          )}
          {/* Completed: final summary stays visible */}
          {status === 'completed' && summary && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-0.5 text-xs text-ink-muted leading-relaxed"
            >
              {summary}
            </motion.p>
          )}
          {/* Error */}
          {status === 'error' && summary && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-0.5 text-xs text-danger"
            >
              {summary}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
export default ActivityStepRow
