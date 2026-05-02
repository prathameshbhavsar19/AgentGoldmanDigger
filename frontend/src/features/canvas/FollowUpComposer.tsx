import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { followUpSchema, type FollowUp } from '../../lib/validators'
import { sendFollowUp } from '../../lib/api'
import { useCanvasStore } from '../../stores/canvasStore'
import Button from '../../components/ui/Button'
import { copy } from '../../lib/copy'
import { ArrowUp, ChevronDown, ChevronUp } from 'lucide-react'

interface FollowUpComposerProps { jobId: string }

export function FollowUpComposer({ jobId }: FollowUpComposerProps) {
  const [expanded, setExpanded] = useState(false)
  const { status } = useCanvasStore()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FollowUp>({
    resolver: zodResolver(followUpSchema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: ({ question }: FollowUp) => sendFollowUp(jobId, question),
    onSuccess: () => reset(),
  })

  if (status !== 'ready' && status !== 'streaming') return null

  return (
    <div className="border-t border-[var(--border)] bg-bg-elev mt-6 sticky bottom-0">
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-ink-muted hover:text-ink transition-colors cursor-pointer"
      >
        <span className="font-medium">Ask a follow-up question</span>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          {/* Example prompts */}
          <div className="flex flex-wrap gap-2 mb-3">
            {copy.canvas.exampleFollowUps.slice(0,3).map(q => (
              <button
                key={q}
                type="button"
                onClick={() => reset({ question: q })}
                className="text-xs px-2.5 py-1.5 rounded-full border border-[var(--border)] text-ink-muted hover:border-brand hover:text-brand transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
          {/* Input */}
          <form onSubmit={handleSubmit(d => mutate(d))} className="flex gap-2">
            <input
              {...register('question')}
              placeholder={copy.canvas.followUpPlaceholder}
              className="flex-1 rounded border border-[var(--border)] bg-bg-elev px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand"
              data-testid="followup-input"
            />
            <Button type="submit" loading={isPending} size="md" className="px-3" aria-label="Send follow-up">
              <ArrowUp className="h-4 w-4" />
            </Button>
          </form>
          {errors.question && <p className="text-xs text-danger mt-1">{errors.question.message}</p>}
        </div>
      )}
    </div>
  )
}
export default FollowUpComposer
