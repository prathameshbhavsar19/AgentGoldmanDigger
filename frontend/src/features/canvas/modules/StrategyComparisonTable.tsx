import { motion } from 'framer-motion'
import Card from '../../../components/ui/Card'
import Badge from '../../../components/ui/Badge'

interface ComparisonRow { strategy: string; risk: string; volatility: string; liquidity: string; goalFit: string; complexity: string; bestFor: string }
interface StrategyComparisonTableProps { rows?: ComparisonRow[]; options?: Array<{ id: string; title: string; riskLevel: string; goalFit: string; pros: string[] }> }

export function StrategyComparisonTable({ rows, options }: StrategyComparisonTableProps) {
  const data: ComparisonRow[] = rows ?? (options ?? []).map(o => ({
    strategy: o.title, risk: o.riskLevel, volatility: o.riskLevel,
    liquidity: 'High', goalFit: o.goalFit, complexity: 'Low', bestFor: o.pros[0] ?? '—',
  }))

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.35 }}>
      <Card padding="sm">
        <h3 className="font-semibold text-ink mb-3 px-2">Strategy Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Strategy','Risk','Volatility','Liquidity','Goal Fit','Complexity','Best For'].map(h => (
                  <th key={h} className="text-left px-2 py-2 text-ink-faint font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]/50">
              {data.map(r => (
                <tr key={r.strategy} className="hover:bg-[var(--bg-subtle)] transition-colors">
                  <td className="px-2 py-2 font-medium text-ink">{r.strategy}</td>
                  <td className="px-2 py-2"><Badge variant={r.risk === 'Low' ? 'success' : r.risk === 'Moderate' ? 'brand' : 'warn'}>{r.risk}</Badge></td>
                  <td className="px-2 py-2 text-ink-muted">{r.volatility}</td>
                  <td className="px-2 py-2 text-ink-muted">{r.liquidity}</td>
                  <td className="px-2 py-2 text-ink-muted">{r.goalFit}</td>
                  <td className="px-2 py-2 text-ink-muted">{r.complexity}</td>
                  <td className="px-2 py-2 text-ink-muted max-w-[140px] truncate">{r.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  )
}
export default StrategyComparisonTable
