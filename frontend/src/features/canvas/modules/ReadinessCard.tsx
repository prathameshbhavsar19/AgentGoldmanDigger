import { motion } from 'framer-motion'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'
import { Check, AlertCircle, TrendingUp } from 'lucide-react'

type FactorStatus = 'good' | 'ok' | 'warn' | 'low'

interface Factor { key: string; status: FactorStatus; note: string }
interface ReadinessProps { score: string; label: string; factors: Factor[] }

const STATUS_ICONS: Record<FactorStatus, { icon: typeof Check; cls: string }> = {
  good: { icon: TrendingUp,    cls: 'text-success' },
  ok:   { icon: Check,         cls: 'text-brand' },
  warn: { icon: AlertCircle,   cls: 'text-warn' },
  low:  { icon: AlertCircle,   cls: 'text-danger' },
}

const SCORE_BADGE: Record<string, 'success' | 'accent' | 'brand' | 'warn'> = {
  ready: 'success', balanced: 'brand', cautious: 'accent', needs_buffer: 'warn',
}

export function ReadinessCard({ score, label, factors }: ReadinessProps) {
  const badgeVariant = SCORE_BADGE[score] ?? 'default'
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink">Financial Readiness</h3>
          <Badge variant={badgeVariant}>{label}</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {factors.map(f => {
            const { icon: Icon, cls } = STATUS_ICONS[f.status] ?? STATUS_ICONS.ok
            return (
              <div key={f.key} className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--bg-subtle)]">
                <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cls}`} />
                <div>
                  <p className="text-xs font-medium text-ink">{f.key}</p>
                  <p className="text-xs text-ink-muted">{f.note}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}
export default ReadinessCard
