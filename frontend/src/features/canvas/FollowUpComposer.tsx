import { useCanvasStore } from '../../stores/canvasStore'
import { Sparkles } from 'lucide-react'

interface FollowUpComposerProps { jobId: string }

export function FollowUpComposer({ jobId: _jobId }: FollowUpComposerProps) {
  const { status } = useCanvasStore()

  if (status !== 'ready' && status !== 'streaming') return null

  return (
    <div className="border-t border-[var(--border)] bg-bg-elev sticky bottom-0">
      <div className="w-full flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <Sparkles className="h-4 w-4 text-brand/50" />
          <span className="font-medium">Ask a follow-up question</span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-accent-soft text-accent-strong border border-accent/20">
          Coming soon
        </span>
      </div>
    </div>
  )
}
export default FollowUpComposer
