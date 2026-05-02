import { motion } from 'framer-motion'
import { useCanvasStore } from '../../stores/canvasStore'
import { ActivityStepRow } from './ActivityStepRow'
import { copy } from '../../lib/copy'

export function ActivityFeed() {
  const { steps, status } = useCanvasStore()

  return (
    <aside
      aria-label="AI Analyst Activity"
      className="h-full flex flex-col gap-2"
    >
      <div className="pb-2 border-b border-[var(--border)]">
        <p className="text-xs font-semibold tracking-wider uppercase text-ink-faint">
          {copy.canvas.activityTitle}
        </p>
      </div>

      {steps.length === 0 && status === 'streaming' && (
        <div className="flex items-center gap-2 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse-gold" />
          <span className="text-xs text-ink-muted">Starting analysis…</span>
        </div>
      )}

      <div className="flex flex-col divide-y divide-[var(--border)]/50 overflow-y-auto flex-1">
        {steps.map(step => (
          <ActivityStepRow key={step.stepId} step={step} />
        ))}
      </div>

      {status === 'ready' && steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 pt-2 border-t border-[var(--border)] flex items-center gap-2"
        >
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-xs font-medium text-success">Analysis complete</span>
        </motion.div>
      )}

      {status === 'failed' && (
        <div className="mt-2 pt-2 border-t border-[var(--border)] text-xs text-danger">
          Analysis failed. See error above.
        </div>
      )}
    </aside>
  )
}
export default ActivityFeed
