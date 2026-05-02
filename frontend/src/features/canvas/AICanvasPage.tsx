import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCanvasStore } from '../../stores/canvasStore'
import { useStrategyStream } from '../../lib/useStrategyStream'
import { ActivityFeed } from './ActivityFeed'
import { CanvasSkeleton } from './CanvasSkeleton'
import { CanvasModuleRenderer } from './CanvasModuleRenderer'
import { FollowUpComposer } from './FollowUpComposer'
import { CompareDialog } from './actions/CompareDialog'
import { downloadReport } from './actions/DownloadReport'
import { Logo } from '../../components/brand/Logo'
import Button from '../../components/ui/Button'
import { copy } from '../../lib/copy'
import { Download, Layers } from 'lucide-react'

export default function AICanvasPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const { status, modules, userName, setJobId } = useCanvasStore()
  const [compareOpen, setCompareOpen] = useState(false)
  // follow-up toggle handled by FollowUpComposer
  useStrategyStream(jobId)

  useEffect(() => {
    if (jobId) setJobId(jobId)
  }, [jobId, setJobId])

  const isReady = status === 'ready'

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      {/* Top bar */}
      <header className="flex-shrink-0 h-14 border-b border-[var(--border)] bg-bg-elev flex items-center px-4 md:px-6 gap-4">
        <Logo size="sm" />
        <div className="flex-1" />
        {userName && <span className="text-sm text-ink-muted hidden md:block">{userName}</span>}
        {/* Status pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
          isReady
            ? 'bg-[var(--success-soft)] text-success border-success/20'
            : status === 'failed'
            ? 'bg-[var(--danger-soft)] text-danger border-danger/20'
            : 'bg-[var(--warn-soft)] text-warn border-warn/20'
        }`}>
          <div className={`h-1.5 w-1.5 rounded-full ${isReady ? 'bg-success' : status === 'failed' ? 'bg-danger' : 'bg-warn animate-pulse'}`} />
          {isReady ? copy.canvas.statusReady : status === 'failed' ? 'Failed' : copy.canvas.statusAnalyzing}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={!isReady}
          onClick={() => jobId && downloadReport(jobId)}
          className="gap-1.5"
          data-testid="btn-download"
        >
          <Download className="h-4 w-4" />
          <span className="hidden md:inline">Download</span>
        </Button>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Activity feed */}
        <aside className="hidden lg:flex w-72 xl:w-80 flex-shrink-0 border-r border-[var(--border)] bg-bg-elev flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            <ActivityFeed />
          </div>
        </aside>

        {/* Right: Canvas */}
        <main id="canvas-main" className="flex-1 overflow-y-auto">
          {/* Mobile activity feed — collapsed */}
          <div className="lg:hidden border-b border-[var(--border)] bg-bg-elev">
            <details className="group">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-medium text-ink-muted hover:text-ink list-none">
                <Layers className="h-4 w-4" />
                AI Analyst Activity
              </summary>
              <div className="px-4 pb-4">
                <ActivityFeed />
              </div>
            </details>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Empty state / skeleton */}
            {modules.length === 0 && status !== 'failed' && (
              <div className="mb-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-ink mb-2">{copy.canvas.emptyTitle}</h2>
                  <p className="text-ink-muted text-sm">{copy.canvas.emptySubtitle}</p>
                </motion.div>
                <CanvasSkeleton />
              </div>
            )}

            {/* Summary banner once ready */}
            {isReady && userName && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-brand text-white"
              >
                <p className="font-semibold">{userName}, your portfolio strategy is ready.</p>
                <p className="text-sm text-white/70 mt-0.5">
                  Portfolio GPS prepared {modules.filter(m => m.type === 'strategy_options').length > 0 ? '3' : ''} strategy paths based on your profile.
                </p>
              </motion.div>
            )}

            {/* Modules */}
            <div className="flex flex-col gap-6">
              {modules.map(module => (
                <CanvasModuleRenderer
                  key={module.moduleId}
                  module={module}
                  onCompare={() => setCompareOpen(true)}
                  onDownload={() => jobId && downloadReport(jobId)}
                  onFollowUp={() => {}}
                />
              ))}
            </div>

            {/* Failed state */}
            {status === 'failed' && (
              <div className="p-6 rounded-lg border border-danger/30 bg-[var(--danger-soft)] text-danger text-sm">
                The analysis failed. Please try again or contact support.
              </div>
            )}
          </div>

          {/* Follow-up composer */}
          {jobId && <FollowUpComposer jobId={jobId} />}
        </main>
      </div>

      {/* Compare dialog */}
      <CompareDialog open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}
