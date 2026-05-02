import { motion } from 'framer-motion'
import Button from '../../../components/ui/Button'
import { ArrowRight, GitCompare, Download, MessageSquare } from 'lucide-react'
import { useCanvasStore } from '../../../stores/canvasStore'

interface NextAction { label: string; action: string }
interface NextStepActionsProps {
  primary: NextAction; secondary: NextAction[];
  onCompare?: () => void; onDownload?: () => void; onFollowUp?: () => void
}

const ICONS: Record<string, typeof ArrowRight> = {
  select: ArrowRight, compare: GitCompare, download: Download, 'follow-up': MessageSquare,
}

export function NextStepActions({ primary, secondary, onCompare, onDownload, onFollowUp }: NextStepActionsProps) {
  const { selectedOption, selectOption, status } = useCanvasStore()

  const handleAction = (action: string) => {
    if (action === 'compare')    onCompare?.()
    if (action === 'download')   onDownload?.()
    if (action === 'follow-up')  onFollowUp?.()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }}>
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
