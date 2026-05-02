/**
 * GoalSummaryCard — hero slide: emoji + headline + description + stat bubbles.
 * v3-rich: headline + 2-3 sentence description + stat bubbles
 * v1 legacy: minimal fallback
 */
import { motion } from 'framer-motion'

interface StatBubble {
  emoji: string
  label: string
  value: string
}

interface GoalSummaryProps {
  // v3-rich / v2 visual schema
  emoji?: string
  headline?: string
  description?: string
  subline?: string
  stats?: StatBubble[]
  // v1 legacy fallback
  name?: string
  goal?: string
  timeHorizon?: string
  monthlyAmount?: string
  riskTone?: string
}

export function GoalSummaryCard(p: GoalSummaryProps) {
  // v2/v3 visual schema — headline + stats present
  if (p.headline && p.stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#003366] via-[#00448a] to-[#1a5276] text-white shadow-xl"
      >
        <div className="p-6 md:p-8">
          {/* Emoji + headline row */}
          <div className="flex items-start gap-4 mb-4">
            <div className="text-5xl flex-shrink-0 leading-none">{p.emoji ?? '🎯'}</div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50 font-semibold mb-1">Your Goal</p>
              <h2 className="text-xl md:text-2xl font-bold leading-snug">{p.headline}</h2>
            </div>
          </div>

          {/* Description paragraph */}
          {(p.description || p.subline) && (
            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-6 border-l-2 border-white/20 pl-4">
              {p.description ?? p.subline}
            </p>
          )}

          {/* Stat bubbles */}
          {p.stats && p.stats.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {p.stats.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                  className="flex items-center gap-2.5 bg-white/15 backdrop-blur rounded-xl px-4 py-3 min-w-[120px]"
                >
                  <span className="text-2xl">{s.emoji}</span>
                  <div>
                    <p className="text-white/55 text-[10px] uppercase tracking-wider font-semibold leading-none mb-1">{s.label}</p>
                    <p className="text-white font-bold text-sm leading-none">{s.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // v1 legacy fallback
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-gradient-to-br from-[#003366] to-[#1a5276] text-white p-6 md:p-8 shadow-lg"
    >
      <div className="text-4xl mb-3">🎯</div>
      <p className="text-xs uppercase tracking-widest text-white/50 font-semibold mb-1">Your Goal</p>
      <h2 className="text-xl font-bold mb-2">{p.name ? `${p.name}'s goal` : 'Your investment goal'}</h2>
      {p.goal && <p className="text-white/75 text-sm leading-relaxed">{p.goal}</p>}
      {(p.timeHorizon || p.monthlyAmount) && (
        <div className="flex gap-3 mt-4 flex-wrap">
          {p.timeHorizon && (
            <div className="bg-white/15 rounded-xl px-4 py-2">
              <p className="text-white/55 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Time</p>
              <p className="text-white font-bold text-sm">{p.timeHorizon}</p>
            </div>
          )}
          {p.monthlyAmount && (
            <div className="bg-white/15 rounded-xl px-4 py-2">
              <p className="text-white/55 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Monthly</p>
              <p className="text-white font-bold text-sm">{p.monthlyAmount}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default GoalSummaryCard
