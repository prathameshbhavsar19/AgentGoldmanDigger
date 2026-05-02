import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, GitCompare, Download, MessageSquare } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { useCanvasStore } from '../../../stores/canvasStore'

interface NextAction { label: string; action: string }
interface NextStepActionsProps {
  // Canvas LLM may produce either:
  //   { primary, secondary } — legacy structured format
  //   { actions: string[] }  — plain list format (current LLM output)
  primary?: NextAction
  secondary?: NextAction[]
  actions?: string[]
  onCompare?: () => void; onDownload?: () => void; onFollowUp?: () => void
}

const ICONS: Record<string, typeof ArrowRight> = {
  select: ArrowRight, compare: GitCompare, download: Download, 'follow-up': MessageSquare,
}

export function NextStepActions({ primary, secondary = [], actions, onCompare, onDownload, onFollowUp }: NextStepActionsProps) {
  const { selectedOption, selectOption, status } = useCanvasStore()

  // Plain-list format: render as ordered numbered steps
  if (actions && actions.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        data-testid="next-steps-module"
      >
        <div className="rounded-xl border border-[var(--border)] bg-bg-elev p-5">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-brand" />
            Your action plan
          </h3>
          <ol className="space-y-3">
            {actions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink-muted">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center font-medium mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-5 flex flex-wrap gap-3 border-t border-[var(--border)] pt-4">
            <Button size="md" onClick={() => onDownload?.()} className="gap-2" data-testid="btn-download-steps">
              <Download className="h-4 w-4" />
              Download report
            </Button>
            <Button variant="secondary" size="md" onClick={() => onCompare?.()} className="gap-2" data-testid="btn-compare">
              <GitCompare className="h-4 w-4" />
              Compare strategies
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Structured format: primary CTA + secondary action buttons
  if (!primary) return null

  const handleAction = (action: string) => {
    if (action === 'compare')    onCompare?.()
    if (action === 'download')   onDownload?.()
    if (action === 'follow-up')  onFollowUp?.()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}
      data-testid="next-steps-module">
      <div className="border-t border-[var(--border)] pt-4 flex flex-wrap gap-3">
        <Button
          size="md"
          onClick={() => selectOption(selectedOption ? null : 'option-b')}
          className="gap-2"
          data-testid="btn-select-path"
        >
          <ArrowRight className="h-4 w-4" />
          {selectedOption ? 'Path selected' : primary.label}
        </Button>
        {secondary.map(a => {
          const Icon = ICONS[a.action] ?? ArrowRight
          return (
            <Button
              key={a.action}
              variant="secondary"
              size="md"
              onClick={() => handleAction(a.action)}
              disabled={a.action === 'download' && status !== 'ready'}
              className="gap-2"
              data-testid={`btn-${a.action}`}
            >
              <Icon className="h-4 w-4" />
              {a.label}
            </Button>
          )
        })}
      </div>
    </motion.div>
  )
}
export default NextStepActions
