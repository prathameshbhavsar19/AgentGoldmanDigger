/**
 * Strategy Options — risk-tinted expandable cards with allocation bars.
 *
 * Design:
 *  - Each option has a left-border tint: green (low), amber (moderate), red (high)
 *  - Click to expand: shows full details_md_plain, allocation bars, pros/cons, CTA
 *  - Glossary terms get dotted underline + tooltip
 *  - Framer-motion stagger on entry
 */
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import Card from '../../../components/ui/Card'
import type { GlossaryTerm } from './Glossary'

// ─── Types ───────────────────────────────────────────────────────────────────

export type RiskTint = 'low' | 'moderate' | 'high'

export interface AllocationRow {
  label: string
  percent: number
  monthly_amount?: string
}

export interface StrategyOption {
  id: string
  title: string
  risk_level: string
  risk_tint: RiskTint
  summary_plain?: string
  best_for_plain?: string
  allocation?: AllocationRow[]
  details_md_plain?: string
  pros?: string[]
  cons?: string[]
  agent_guidance_plain?: string
  // Legacy (old format)
  risk?: string
  summary?: string
  pros_cons?: { pro: string; con: string }[]
}

interface StrategyOptionsProps {
  options: StrategyOption[]
  glossaryTerms?: GlossaryTerm[]
}

// ─── Risk tint helpers ───────────────────────────────────────────────────────

const TINT_STYLES: Record<RiskTint, { border: string; bg: string; badge: string; bar: string }> = {
  low: {
    border: 'border-l-4 border-l-emerald-500',
    bg: 'bg-emerald-50/40',
    badge: 'bg-emerald-100 text-emerald-800',
    bar: 'bg-emerald-500',
  },
  moderate: {
    border: 'border-l-4 border-l-amber-500',
    bg: 'bg-amber-50/40',
    badge: 'bg-amber-100 text-amber-800',
    bar: 'bg-amber-500',
  },
  high: {
    border: 'border-l-4 border-l-rose-500',
    bg: 'bg-rose-50/40',
    badge: 'bg-rose-100 text-rose-800',
    bar: 'bg-rose-500',
  },
}

function resolveRiskTint(opt: StrategyOption): RiskTint {
  if (opt.risk_tint) return opt.risk_tint as RiskTint
  const rl = (opt.risk_level ?? opt.risk ?? '').toLowerCase()
  if (rl.includes('low')) return 'low'
  if (rl.includes('medium-high') || rl.includes('high')) return 'high'
  return 'moderate'
}

// ─── Allocation bar ───────────────────────────────────────────────────────────

function AllocationBars({ allocation }: { allocation: AllocationRow[] }) {
  return (
    <div className="space-y-2 my-4">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Asset Allocation</p>
      {allocation.map((row, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-ink truncate max-w-[60%]">{row.label}</span>
            <span className="text-ink-muted font-medium">
              {row.percent}%{row.monthly_amount ? ` · ${row.monthly_amount}` : ''}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${row.percent}%` }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Glossary tooltip ────────────────────────────────────────────────────────

function GlossaryTooltip({ term, children }: { term: GlossaryTerm; children: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block">
      <span
        className="border-b border-dotted border-brand/60 cursor-help text-ink"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        tabIndex={0}
        aria-describedby={`tt-${term.term}`}
      >
        {children}
      </span>
      <AnimatePresence>
        {show && (
          <motion.div
            id={`tt-${term.term}`}
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-60 p-2.5 rounded-lg shadow-lg bg-[var(--bg-elev)] border border-[var(--border)] text-xs text-ink leading-relaxed"
          >
            <p className="font-semibold mb-0.5">{term.term}</p>
            <p className="text-ink-muted">{term.plain_definition}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}

// ─── Simple prose renderer with glossary term highlighting ───────────────────

function PlainText({ text, glossaryTerms }: { text: string; glossaryTerms?: GlossaryTerm[] }) {
  if (!glossaryTerms?.length) {
    return <span>{text}</span>
  }
  // Replace jargon terms with tooltip-wrapped spans
  const parts: JSX.Element[] = []
  let remaining = text
  let key = 0

  for (const term of glossaryTerms) {
    const idx = remaining.toLowerCase().indexOf(term.term.toLowerCase())
    if (idx === -1) continue
    if (idx > 0) parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>)
    parts.push(
      <GlossaryTooltip key={key++} term={term}>
        {remaining.slice(idx, idx + term.term.length)}
      </GlossaryTooltip>
    )
    remaining = remaining.slice(idx + term.term.length)
  }
  if (remaining) parts.push(<span key={key++}>{remaining}</span>)
  return <>{parts}</>
}

// ─── Option card ────────────────────────────────────────────────────────────

function OptionCard({
  opt,
  index,
  expanded,
  onToggle,
  glossaryTerms,
}: {
  opt: StrategyOption
  index: number
  expanded: boolean
  onToggle: () => void
  glossaryTerms?: GlossaryTerm[]
}) {
  const tint = resolveRiskTint(opt)
  const styles = TINT_STYLES[tint]
  const summary = opt.summary_plain ?? opt.summary ?? ''
  const details = opt.details_md_plain ?? ''
  const pros = opt.pros ?? []
  const cons = opt.cons ?? []
  const guidance = opt.agent_guidance_plain ?? ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
      className={`rounded-xl border border-[var(--border)] shadow-[0_1px_8px_rgba(0,0,0,0.06)] overflow-hidden ${styles.border} ${expanded ? styles.bg : ''} transition-colors duration-200`}
      data-testid={`strategy-option-${opt.id}`}
    >
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-[var(--bg-subtle)] transition-colors duration-150 cursor-pointer"
        aria-expanded={expanded}
        aria-controls={`option-detail-${opt.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-ink">{opt.title}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles.badge}`}>
              {opt.risk_level ?? opt.risk}
            </span>
          </div>
          {summary && (
            <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">{summary}</p>
          )}
          {opt.best_for_plain && (
            <p className="text-xs text-ink-faint mt-0.5 italic">{opt.best_for_plain}</p>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-ink-muted flex-shrink-0 mt-0.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`option-detail-${opt.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Allocation bars */}
              {opt.allocation && opt.allocation.length > 0 && (
                <AllocationBars allocation={opt.allocation} />
              )}

              {/* Full details */}
              {details && (
                <div className="text-xs text-ink-muted leading-relaxed whitespace-pre-line">
                  <PlainText text={details} glossaryTerms={glossaryTerms} />
                </div>
              )}

              {/* Pros / Cons */}
              {(pros.length > 0 || cons.length > 0) && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {pros.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">Pros</p>
                      <ul className="space-y-1">
                        {pros.map((p, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-ink-muted">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cons.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-rose-700 uppercase tracking-wide mb-1.5">Cons</p>
                      <ul className="space-y-1">
                        {cons.map((c, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-ink-muted">
                            <XCircle className="h-3.5 w-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Agent guidance */}
              {guidance && (
                <div className="p-3 rounded-lg bg-brand/5 border border-brand/10">
                  <p className="text-xs text-brand font-medium mb-0.5">Advisor guidance</p>
                  <p className="text-xs text-ink-muted leading-relaxed">{guidance}</p>
                </div>
              )}

              {/* CTA */}
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand/90 transition-colors cursor-pointer"
                data-testid={`select-option-${opt.id}`}
                onClick={() => {
                  /* handled by parent if needed */
                }}
              >
                Select this path
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function StrategyOptions({ options, glossaryTerms }: StrategyOptionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggle = (id: string) => setExpandedId(prev => (prev === id ? null : id))

  if (!options?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      data-testid="strategy-options-module"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Your Strategy Options</h3>
        <span className="text-xs text-ink-muted">{options.length} paths</span>
      </div>

      {/* Mobile: 1 col, sm: 1 col, md+: depends on count */}
      <div className={`grid gap-4 ${options.length <= 2 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
        {options.map((opt, i) => (
          <OptionCard
            key={opt.id}
            opt={opt}
            index={i}
            expanded={expandedId === opt.id}
            onToggle={() => toggle(opt.id)}
            glossaryTerms={glossaryTerms}
          />
        ))}
      </div>
    </motion.div>
  )
}

export default StrategyOptions
