/**
 * ImportantConsiderations — "fee radar" visual cards.
 * v2: grid of cost cards with emoji + dollar example + colour verdict
 * v1: plain list fallback
 */
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

interface FeeItem {
  // v3-rich / v2 visual fields
  emoji?: string
  name?: string
  what_it_is?: string
  cost_example?: string
  verdict?: string
  verdict_color?: 'green' | 'amber' | 'red'
  // v1 legacy
  verbatim?: string
  plain_meaning?: string
}

interface ImportantConsiderationsProps {
  headline?: string
  intro?: string
  items: (FeeItem | string)[]
}

const VERDICT_STYLE: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100  text-amber-800',
  red:   'bg-rose-100   text-rose-800',
}

function FeeCard({ item, index }: { item: FeeItem | string; index: number }) {
  if (typeof item === 'string') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.07 }}
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4"
      >
        <p className="text-xs text-ink-muted leading-relaxed">⚠️ {item}</p>
      </motion.div>
    )
  }

  const hasV2 = item.name || item.cost_example
  if (!hasV2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.07 }}
        className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 space-y-1.5"
      >
        <p className="text-xs font-medium text-ink leading-snug">{item.verbatim}</p>
        {item.plain_meaning && (
          <p className="text-xs text-ink-muted leading-relaxed">💡 {item.plain_meaning}</p>
        )}
      </motion.div>
    )
  }

  const vColor = item.verdict_color ?? 'amber'
  const vStyle = VERDICT_STYLE[vColor] ?? VERDICT_STYLE.amber

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-4 flex items-start gap-3"
    >
      {item.emoji && <span className="text-2xl flex-shrink-0">{item.emoji}</span>}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-semibold text-ink text-sm">{item.name}</p>
          {item.verdict && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${vStyle}`}>
              {item.verdict}
            </span>
          )}
        </div>
        {item.what_it_is && (
          <p className="text-xs text-ink-muted leading-relaxed mb-1">{item.what_it_is}</p>
        )}
        {item.cost_example && (
          <p className="text-xs text-ink font-medium leading-relaxed">{item.cost_example}</p>
        )}
      </div>
    </motion.div>
  )
}

export function ImportantConsiderations({ headline, intro, items }: ImportantConsiderationsProps) {
  if (!items?.length) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] overflow-hidden shadow-sm"
    >
      {/* Header */}
      <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h3 className="font-bold text-ink text-base">
            {headline ?? 'What will this actually cost you? No surprises.'}
          </h3>
          {intro && <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">{intro}</p>}
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <FeeCard key={i} item={item} index={i} />
        ))}
      </div>
    </motion.div>
  )
}

export default ImportantConsiderations
