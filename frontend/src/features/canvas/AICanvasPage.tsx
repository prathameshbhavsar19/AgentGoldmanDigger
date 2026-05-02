import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Download, Layers, Sparkles } from 'lucide-react'

// ─── Building shimmer ─────────────────────────────────────────────────────────

function BuildingShimmer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center justify-center py-16 gap-4"
      data-testid="building-shimmer"
    >
      {/* Animated sparkle icon */}
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="h-14 w-14 rounded-2xl bg-brand/10 flex items-center justify-center"
        >
          <Sparkles className="h-7 w-7 text-brand" />
        </motion.div>
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-ink mb-1">Building your personalised canvas…</p>
        <p className="text-xs text-ink-muted max-w-xs mx-auto">
          Our AI demystifier is translating your analysis into plain language. This takes a moment.
        </p>
      </div>

      {/* Shimmer bar rows */}
      <div className="w-full max-w-md space-y-3 mt-2">
        {[80, 60, 90, 50, 70].map((w, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            className="h-3 rounded-full bg-[var(--bg-subtle)]"
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AICanvasPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const { status, modules, userName, setJobId } = useCanvasStore()
  const [compareOpen, setCompareOpen] = useState(false)
  useStrategyStream(jobId)

  useEffect(() => {
    if (jobId) setJobId(jobId)
  }, [jobId, setJobId])

  const isReady = status === 'ready'
  const isBuilding = status === 'building'
  const isStreaming = status === 'streaming'
  const optionCount = (() => {
    const stratMod = modules.find(m => m.type === 'strategy_options')
    if (!stratMod) return 0
    return (stratMod.props as any)?.options?.length ?? 0
  })()

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      {/* Top bar */}
      <header className="flex-shrink-0 h-14 border-b border-[var(--border)] bg-bg-elev flex items-center px-4 md:px-6 gap-4">
        <Logo size="sm" />
        <div className="flex-1" />
        {userName && <span className="text-sm text-ink-muted hidden md:block">{userName}</span>}

        {/* Status pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-300 ${
          isReady
            ? 'bg-[var(--success-soft)] text-success border-success/20'
            : status === 'failed'
            ? 'bg-[var(--danger-soft)] text-danger border-danger/20'
            : isBuilding
            ? 'bg-brand/10 text-brand border-brand/20'
            : 'bg-[var(--warn-soft)] text-warn border-warn/20'
        }`}>
          <div className={`h-1.5 w-1.5 rounded-full ${
            isReady ? 'bg-success' : status === 'failed' ? 'bg-danger' : 'bg-current animate-pulse'
          }`} />
          {isReady
            ? copy.canvas.statusReady
            : status === 'failed'
            ? 'Failed'
            : isBuilding
            ? 'Building canvas…'
            : copy.canvas.statusAnalyzing}
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
          {/* Mobile activity feed */}
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
            {/* Empty / thinking state */}
            {modules.length === 0 && status !== 'failed' && !isBuilding && (
              <div className="mb-6">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
                  <h2 className="text-xl font-semibold text-ink mb-2">{copy.canvas.emptyTitle}</h2>
                  <p className="text-ink-muted text-sm">{copy.canvas.emptySubtitle}</p>
                </motion.div>
                <CanvasSkeleton />
              </div>
            )}

            {/* Building shimmer */}
            <AnimatePresence>
              {isBuilding && modules.length === 0 && (
                <BuildingShimmer />
              )}
            </AnimatePresence>

            {/* Summary banner once ready */}
            {isReady && userName && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl bg-brand text-white shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
              >
                <p className="font-semibold">{userName}, your portfolio strategy is ready.</p>
                <p className="text-sm text-white/70 mt-0.5">
                  Portfolio GPS prepared{optionCount > 0 ? ` ${optionCount}` : ''} strategy paths based on your profile.
                </p>
              </motion.div>
            )}

            {/* Canvas modules — stagger on entry */}
            {modules.length > 0 && (
              <motion.div
                className="flex flex-col gap-5"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.08 } },
                  hidden: {},
                }}
              >
                {modules.map(module => (
                  <CanvasModuleRenderer
                    key={module.moduleId}
                    module={module}
                    allModules={modules}
                    onCompare={() => setCompareOpen(true)}
                    onDownload={() => jobId && downloadReport(jobId)}
                    onFollowUp={() => {}}
                  />
                ))}
              </motion.div>
            )}

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
