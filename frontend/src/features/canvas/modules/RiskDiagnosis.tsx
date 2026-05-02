/**
 * RiskDiagnosis — health-score card with rich explanatory bullets.
 * v3-rich: score circle + intro + titled bullets with full text
 * v1 legacy: plain text fallback
 */
import { motion } from 'framer-motion'

interface Bullet {
  emoji: string
  title?: string
  text: string
}

interface RiskDiagnosisProps {
  // v3-rich / v2 visual schema
  score?: number
  score_label?: string
  score_color?: 'green' | 'amber' | 'red'
  headline?: string
  intro?: string
  bullets?: Bullet[]
  // v1 legacy fallback
  diagnosis_plain?: string
  key_concerns?: string[]
}

const COLOR = {
  green: {
    ring: 'stroke-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    badge: 'bg-emerald-100 text-emerald-800',
    border: 'border-emerald-200',
  },
  amber: {
    ring: 'stroke-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    badge: 'bg-amber-100 text-amber-800',
    border: 'border-amber-200',
  },
  red: {
    ring: 'stroke-rose-500',
    text: 'text-rose-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    badge: 'bg-rose-100 text-rose-800',
    border: 'border-rose-200',
  },
}

function ScoreCircle({ score, color }: { score: number; color: 'green' | 'amber' | 'red' }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const c = COLOR[color]
  return (
    <div className="relative flex-shrink-0">
      <svg width="84" height="84" viewBox="0 0 84 84" className="-rotate-90">
        <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-gray-200" />
        <motion.circle
          cx="42" cy="42" r={r}
          fill="none"
          strokeWidth="7"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - fill }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className={c.ring}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-extrabold leading-none ${c.text}`}>{score}</span>
        <span className="text-[9px] text-gray-400 font-medium leading-none mt-0.5">/100</span>
      </div>
    </div>
  )
}

export function RiskDiagnosis(p: RiskDiagnosisProps) {
  const color: 'green' | 'amber' | 'red' = p.score_color ?? (
    (p.score ?? 70) >= 80 ? 'green' : (p.score ?? 70) >= 60 ? 'amber' : 'red'
  )
  const c = COLOR[color]

  // v2/v3 visual schema
  if (p.bullets && p.bullets.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] shadow-sm overflow-hidden"
      >
        {/* Header row — score + label + headline */}
        <div className={`${c.bg} px-6 py-5 flex items-center gap-5 border-b ${c.border}`}>
          {p.score !== undefined && (
            <ScoreCircle score={p.score} color={color} />
          )}
          <div className="flex-1 min-w-0">
            {p.score_label && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full mb-2 inline-block ${c.badge}`}>
                {p.score_label}
              </span>
            )}
            <h3 className="text-base font-bold text-ink leading-snug">
              {p.headline ?? 'Your portfolio health check'}
            </h3>
            {p.intro && (
              <p className="text-sm text-ink-muted mt-1 leading-relaxed">{p.intro}</p>
            )}
          </div>
        </div>

        {/* Titled bullets with explanations */}
        <div className="divide-y divide-[var(--border)]">
          {p.bullets.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.1 + i * 0.1 }}
              className="flex items-start gap-4 px-6 py-4"
            >
              <span className="text-2xl flex-shrink-0 mt-0.5">{b.emoji}</span>
              <div>
                {b.title && (
                  <p className="text-sm font-semibold text-ink mb-1">{b.title}</p>
                )}
                <p className="text-sm text-ink-muted leading-relaxed">{b.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  // v1 legacy fallback
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">📊</span>
        <h3 className="font-bold text-ink">Portfolio Health Check</h3>
      </div>
      <p className="text-sm text-ink-muted leading-relaxed">{p.diagnosis_plain}</p>
      {p.key_concerns && p.key_concerns.length > 0 && (
        <ul className="mt-3 space-y-2">
          {p.key_concerns.map((concern, i) => (
            <li key={i} className="text-sm text-ink-muted flex gap-2 items-start">
              <span className="flex-shrink-0">⚠️</span>{concern}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}

export default RiskDiagnosis
