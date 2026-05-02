/**
 * StrategyOptions — 3-column horizontal cards inspired by the reference design.
 * Clicking a card opens a detail panel below the grid.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle2, AlertTriangle, Star } from 'lucide-react'
import type { GlossaryTerm } from './Glossary'

// ─── Types ───────────────────────────────────────────────────────────────────

export type RiskTint = 'low' | 'moderate' | 'high'

export interface AllocationRow {
  emoji?: string
  label: string
  percent: number
  monthly_amount?: string
  color?: string
}

export interface StrategyOption {
  id: string
  emoji?: string
  title: string
  card_badge?: string
  risk_tint?: RiskTint
  risk_level?: string
  risk_label?: string
  comfort_label?: string
  tagline?: string
  what_is_it?: string
  best_for?: string
  main_tradeoff?: string
  allocation?: AllocationRow[]
  wins?: string[]
  watchouts?: string[]
  one_liner?: string
  // v1 legacy
  risk?: string
  summary_plain?: string
  summary?: string
  best_for_plain?: string
  details_md_plain?: string
  pros?: string[]
  cons?: string[]
  agent_guidance_plain?: string
}

interface StrategyOptionsProps {
  options: StrategyOption[]
  glossaryTerms?: GlossaryTerm[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function resolveRiskTint(opt: StrategyOption): RiskTint {
  if (opt.risk_tint) return opt.risk_tint as RiskTint
  const rl = (opt.risk_level ?? opt.risk ?? '').toLowerCase()
  if (rl.includes('low')) return 'low'
  if (rl.includes('high')) return 'high'
  return 'moderate'
}

const TINT_BADGE: Record<RiskTint, string> = {
  low:      'bg-emerald-100 text-emerald-800',
  moderate: 'bg-amber-100 text-amber-800',
  high:     'bg-rose-100 text-rose-800',
}

// ─── Stacked allocation bar (inside a card) ───────────────────────────────────

function StackedBar({ allocation }: { allocation: AllocationRow[] }) {
  const total = allocation.reduce((s, r) => s + r.percent, 0)
  const SHADES = ['bg-[#003366]', 'bg-[#1a5276]', 'bg-[#7fb3d3]', 'bg-[#aed6f1]']
  const summary = allocation.map(r => `${r.percent}% ${r.label}`).join(' · ')

  return (
    <div className="mt-3">
      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {allocation.map((row, i) => (
          <motion.div
            key={i}
            className={`${SHADES[i % SHADES.length]} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${(row.percent / total) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
          />
        ))}
      </div>
      {/* Summary text */}
      <p className="text-[10px] text-ink-muted mt-1.5 leading-tight truncate">{summary}</p>
    </div>
  )
}

// ─── Detail panel allocation (right column) ──────────────────────────────────

function AllocationBreakdown({ allocation }: { allocation: AllocationRow[] }) {
  const SHADES = ['bg-[#003366]', 'bg-[#1a5276]', 'bg-[#7fb3d3]', 'bg-[#aed6f1]']
  return (
    <div>
      <p className="text-[11px] font-bold text-ink-muted uppercase tracking-widest mb-3">Allocation breakdown</p>
      <div className="space-y-3">
        {allocation.map((row, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-ink">{row.label}</span>
              <span className="text-sm font-bold text-ink">{row.percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${SHADES[i % SHADES.length]}`}
                initial={{ width: 0 }}
                animate={{ width: `${row.percent}%` }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Strategy card ────────────────────────────────────────────────────────────

function StrategyCard({
  opt,
  index,
  isSelected,
  isRecommended,
  onClick,
}: {
  opt: StrategyOption
  index: number
  isSelected: boolean
  isRecommended: boolean
  onClick: () => void
}) {
  const tint = resolveRiskTint(opt)
  const riskLabel = opt.risk_label ?? opt.risk_level ?? opt.risk ?? ''
  const comfortLabel = opt.comfort_label ?? (tint === 'low' ? 'Low stress' : tint === 'moderate' ? 'Medium stress' : 'High stress')
  const cardBadge = opt.card_badge ?? (isRecommended ? 'AI Recommended' : '')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onClick={onClick}
      className={`relative rounded-2xl border-2 bg-white cursor-pointer transition-all duration-200 p-5 flex flex-col gap-3
        ${isSelected
          ? 'border-[#003366] shadow-[0_0_0_3px_rgba(0,51,102,0.12)] shadow-lg'
          : 'border-[var(--border)] hover:border-[#003366]/40 hover:shadow-md'}
      `}
      data-testid={`strategy-option-${opt.id}`}
    >
      {/* Recommended checkmark */}
      {isSelected && isRecommended && (
        <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-[#003366] flex items-center justify-center">
          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
        </div>
      )}
      {isSelected && !isRecommended && (
        <div className="absolute top-4 right-4">
          <ArrowRight className="h-5 w-5 text-[#003366]" />
        </div>
      )}
      {!isSelected && (
        <div className="absolute top-4 right-4">
          <ArrowRight className="h-5 w-5 text-ink-muted" />
        </div>
      )}

      {/* Badge */}
      {cardBadge && (
        <div className="flex items-center gap-1">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full
            ${isRecommended
              ? 'bg-[#003366] text-white'
              : `${TINT_BADGE[tint]}`}
          `}>
            {isRecommended && <Star className="h-3 w-3" />}
            {cardBadge}
          </span>
        </div>
      )}

      {/* Title + tagline */}
      <div>
        <h4 className="font-bold text-ink text-base leading-tight mb-1">{opt.title}</h4>
        <p className="text-sm text-ink-muted leading-snug">
          {opt.tagline ?? opt.summary_plain ?? opt.summary ?? ''}
        </p>
      </div>

      {/* Allocation bar */}
      {opt.allocation && opt.allocation.length > 0 && (
        <StackedBar allocation={opt.allocation} />
      )}

      {/* Risk + Comfort */}
      <div className="grid grid-cols-2 gap-2 mt-auto pt-1">
        <div className="rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-ink-muted mb-0.5">Risk</p>
          <p className="text-xs font-semibold text-ink">{riskLabel.replace(/[🟢🟡🔴]/g, '').trim()}</p>
        </div>
        <div className="rounded-lg bg-[var(--bg-subtle)] px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-ink-muted mb-0.5">Comfort</p>
          <p className="text-xs font-semibold text-ink">{comfortLabel}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({ opt }: { opt: StrategyOption }) {
  const wins = opt.wins ?? opt.pros ?? []
  const watchouts = opt.watchouts ?? opt.cons ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] overflow-hidden shadow-md"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">

        {/* Left col — why + best_for + tradeoff */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted mb-1">Why this option exists</p>
            <h4 className="font-bold text-ink text-lg mb-2">{opt.title}</h4>
            <p className="text-sm text-ink-muted leading-relaxed">
              {opt.what_is_it ?? opt.details_md_plain ?? opt.summary_plain ?? ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(opt.best_for ?? opt.best_for_plain) && (
              <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-ink-muted mb-1.5">Best for</p>
                <p className="text-xs text-ink leading-relaxed">{opt.best_for ?? opt.best_for_plain}</p>
              </div>
            )}
            {opt.main_tradeoff && (
              <div className="rounded-xl bg-[var(--bg-subtle)] p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-ink-muted mb-1.5">Main tradeoff</p>
                <p className="text-xs text-ink leading-relaxed">{opt.main_tradeoff}</p>
              </div>
            )}
          </div>

          {/* Wins + Watchouts */}
          {(wins.length > 0 || watchouts.length > 0) && (
            <div className="space-y-2">
              {wins.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-ink leading-relaxed">{w}</p>
                </div>
              ))}
              {watchouts.map((w, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-ink leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Decision framing */}
          {opt.one_liner && (
            <div className="rounded-xl border border-[#003366]/15 bg-[#003366]/5 p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#003366]/60 mb-1">Decision framing</p>
              <p className="text-sm text-[#003366] font-medium leading-relaxed">{opt.one_liner}</p>
            </div>
          )}
        </div>

        {/* Right col — allocation + CTA */}
        <div className="p-5 flex flex-col gap-5">
          {opt.allocation && opt.allocation.length > 0 && (
            <AllocationBreakdown allocation={opt.allocation} />
          )}

          {/* AI Recommendation note + CTA */}
          <div className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 space-y-3">
            {opt.agent_guidance_plain && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-ink-muted mb-1">AI Recommendation</p>
                <p className="text-xs text-ink-muted leading-relaxed">{opt.agent_guidance_plain}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-xl bg-[#003366] text-white text-sm font-semibold hover:bg-[#004488] transition-colors cursor-pointer flex items-center justify-center gap-2"
                data-testid={`select-option-${opt.id}`}
              >
                Choose plan
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function StrategyOptions({ options }: StrategyOptionsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (!options?.length) return null

  const selectedOpt = options.find(o => o.id === selectedId) ?? null

  // Determine which is the "recommended" one — first option, or the one badged "AI Recommended"
  const recommendedId = options.find(o =>
    o.card_badge?.toLowerCase().includes('recommended')
  )?.id ?? options[0]?.id

  function handleCardClick(id: string) {
    setSelectedId(prev => prev === id ? null : id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      data-testid="strategy-options-module"
    >
      {/* Section header */}
      <div className="mb-5">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-2xl font-bold text-ink">Recommended strategy options</h2>
          <span className="text-xs text-ink-muted bg-[var(--bg-subtle)] px-2 py-1 rounded-full hidden sm:block">
            {options.length} paths
          </span>
        </div>
        <p className="text-sm text-ink-muted leading-relaxed max-w-xl">
          Each route shows the full picture — how your money is split, how stressful it is to hold,
          and the honest tradeoff — so you can choose with confidence.
        </p>
      </div>

      {/* 3-column card grid */}
      <div className={`grid gap-4 mb-4 ${
        options.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
        options.length >= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
        'grid-cols-1'
      }`}>
        {options.map((opt, i) => (
          <StrategyCard
            key={opt.id}
            opt={opt}
            index={i}
            isSelected={selectedId === opt.id}
            isRecommended={opt.id === recommendedId}
            onClick={() => handleCardClick(opt.id)}
          />
        ))}
      </div>

      {/* Detail panel below grid */}
      <AnimatePresence>
        {selectedOpt && (
          <DetailPanel
            key={selectedOpt.id}
            opt={selectedOpt}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default StrategyOptions
